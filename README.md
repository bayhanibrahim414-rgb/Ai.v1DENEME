# HiBo.AI Platform

Gerçek API bağlantıları kullanan web uygulaması başlangıç projesi:
- OpenAI Responses API ile gerçek sohbet ve kod yardımı
- OpenAI Images API ile gerçek görsel üretimi
- Runway API ile metinden video üretimi (Runway API anahtarı gerekir)
- API anahtarları sunucu tarafındaki `.env` dosyasında tutulur

## Gereksinimler
- Node.js 20+
- OpenAI API anahtarı ve API hesabında kullanılabilir bakiye/erişim
- Video üretimi için ayrıca Runway Developer API anahtarı

## Yerelde çalıştırma
1. Bu klasörü bilgisayarına indir ve aç.
2. Terminalde bu klasöre gir.
3. `.env.example` dosyasını `.env` adıyla kopyala.
4. `.env` içine `OPENAI_API_KEY` değerini ekle. Video istiyorsan `RUNWAY_API_KEY` de ekle.
5. Komutları çalıştır:

```bash
npm install
npm start
```

6. Tarayıcıda `http://localhost:3000` adresini aç.

## Güvenlik
- `.env` dosyasını GitHub'a yükleme.
- API anahtarını HTML/JavaScript içine koyma.
- API çağrıları ücret oluşturabilir; sağlayıcı panellerinde limit ayarla.
- Herkese açık dağıtım öncesi kimlik doğrulama, istek sınırlandırma, içerik politikası ve depolama ekle.

## Video notu
Video endpoint'i Runway Developer API'ye istek gönderir. Model, süre ve oran kabulü hesabın/modelin o anki API şemasına bağlıdır. Runway API erişimi ve kredi gerekir. Sağlayıcı tarafında endpoint/model değişirse `server.js` içindeki `/api/video` rotasını güncelle.
