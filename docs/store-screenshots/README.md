# Mağaza ekran görüntüleri

Seed'li yerel stack, iPhone 17 Pro Max simülatörü (6.9", iOS 26.2), Melih hesabı, konum Çankaya.
Durum çubuğu 09:41 / tam şarj (`xcrun simctl status_bar`).

- `raw/{tr,en}/` — çerçevesiz ham ekranlar, 1320x2868 (site ve mağaza için kaynak).
  01 keşfet · 02 hediye ilanı · 03 ödünç ilanı · 04 kiralık ilanı · 05 talep (tarih + elden ödeme
  notu) · 06 sohbet (istek kartı, onay) · 07 harita (yaklaşık konum) · 08 teslim fotoğrafı · 09 grup.
- `ios-6.9/{tr,en}/` — App Store için başlıklı, 1320x2868, 6 adet.
- `android/{tr,en}/` — Google Play için başlıklı, 1080x1920, 6 adet (iOS durum çubuğu kırpıldı).
- `android/feature-{tr,en}.png` — Play öne çıkan grafik, 1024x500, alfasız; içerik 60 px güvenli alan içinde.
- `android/icon-512.png` — Play simgesi, `assets/icon.png`'den 512x512.
- `frame.py` — başlıklı sürümleri `raw/`'dan yeniden üretir; başlık metinleri içinde.

Notlar:
- İlan ve teslim görselleri yalnızca bu çekim için yerel DB'de düz illüstrasyonlarla değiştirildi
  (seed'deki picsum fotoğrafları ilanla ilgisizdi); `supabase/seed.sql` değişmedi.
- İlan başlıkları kullanıcı içeriği olduğundan EN setinde de Türkçe.
