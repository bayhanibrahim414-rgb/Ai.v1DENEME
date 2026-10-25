import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

const openai = () => {
  if (!process.env.OPENAI_API_KEY) {
    const e = new Error("OPENAI_API_KEY ayarlanmamış. .env dosyasına API anahtarını ekle.");
    e.status = 503;
    throw e;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/status", (_req, res) => {
  res.json({
    chat: Boolean(process.env.OPENAI_API_KEY),
    image: Boolean(process.env.OPENAI_API_KEY),
    video: Boolean(process.env.RUNWAY_API_KEY),
    app: "HiBo.AI"
  });
});

app.post("/api/chat", asyncRoute(async (req, res) => {
  const { messages, mode = "chat" } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Mesaj geçmişi gerekli." });
  }
  const instructions = mode === "code"
    ? "You are HiBo.AI Code Studio, an expert software engineer. Return practical, runnable code. State filenames and setup steps when useful. Never claim code was executed unless it actually was."
    : "You are HiBo.AI, a helpful, careful, creative AI assistant. Reply in the user's language, usually Turkish. Be clear and useful.";
  const response = await openai().responses.create({
    model: process.env.OPENAI_CHAT_MODEL || "gpt-5",
    instructions,
    input: messages.slice(-24).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 24000)
    }))
  });
  res.json({ text: response.output_text || "Yanıt oluşturulamadı." });
}));

app.post("/api/images", asyncRoute(async (req, res) => {
  const { prompt, size = "1024x1024", quality = "high", format = "png" } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: "Görsel açıklaması yaz." });
  const result = await openai().images.generate({
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
    prompt: String(prompt).slice(0, 32000),
    size: ["1024x1024", "1536x1024", "1024x1536"].includes(size) ? size : "1024x1024",
    quality: ["low", "medium", "high", "xhigh", "max"].includes(quality) ? quality : "high",
    output_format: ["png", "jpeg", "webp"].includes(format) ? format : "png",
    n: 1
  });
  const image = result.data?.[0]?.b64_json;
  if (!image) throw new Error("Görsel API'si bir resim döndürmedi.");
  res.json({ dataUrl: `data:image/${format === "jpeg" ? "jpeg" : format};base64,${image}` });
}));

app.post("/api/video", asyncRoute(async (req, res) => {
  if (!process.env.RUNWAY_API_KEY) {
    return res.status(503).json({ error: "Video üretimi için RUNWAY_API_KEY gerekli. Runway Developer hesabından API anahtarı ekle." });
  }
  const { prompt, ratio = "1280:720", duration = 5, model = "gen4.5" } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: "Video açıklaması yaz." });
  const response = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06"
    },
    body: JSON.stringify({
      model,
      promptText: String(prompt).slice(0, 10000),
      ratio,
      duration: Number(duration),
      watermark: false
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error(data?.error || data?.message || `Runway API hatası (${response.status})`);
    e.status = response.status;
    throw e;
  }
  res.json({ taskId: data.id || data.taskId, status: data.status || "PENDING" });
}));

app.get("/api/video/:id", asyncRoute(async (req, res) => {
  if (!process.env.RUNWAY_API_KEY) return res.status(503).json({ error: "RUNWAY_API_KEY gerekli." });
  const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(req.params.id)}`, {
    headers: { "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`, "X-Runway-Version": "2024-11-06" }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error(data?.error || data?.message || `Video durumu alınamadı (${response.status})`);
    e.status = response.status;
    throw e;
  }
  res.json(data);
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = Number(err.status) || 500;
  let message = err.message || "Beklenmeyen sunucu hatası.";
  if (status === 401) message = "API anahtarı geçersiz veya yetkisiz. Sağlayıcı panelini kontrol et.";
  if (status === 429) message = "Kullanım limiti veya bakiye sınırı aşıldı. API hesabını kontrol et.";
  res.status(status).json({ error: message });
});

app.listen(PORT, () => console.log(`HiBo.AI çalışıyor: http://localhost:${PORT}`));
