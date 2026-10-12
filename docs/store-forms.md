# StreetShelf — Konsolda elle doldurulacak formlar

API'si olmayan formların cevapları. Veri listesi `docs/store-listing.md` ("Veri güvenliği formu için not"),
gizlilik politikası ve kod ile uyumludur; uygulama değişirse bu dosya da değişir.

Uygulama **takip yapmaz** (reklam yok, üçüncü taraf analitik/izleme yok), ödeme almaz, çocuklara yönelik
değildir (kullanım koşulları 18+).

## App Store Connect → App Privacy

"Do you or your third-party partners collect data from this app?" → **Yes**.

Her satır için: **Linked to the user: Yes · Used for tracking: No**.

| Veri türü | Amaç |
|---|---|
| Contact Info → Email Address | App Functionality (giriş kodu) |
| Contact Info → Name (görünen ad) | App Functionality |
| User Content → Photos or Videos (ilan, teslim ve avatar fotoğrafı) | App Functionality |
| User Content → Other User Content (ilan metni, yorum) | App Functionality |
| User Content → Customer Support / Messages (sohbet mesajları) | App Functionality |
| Location → Precise Location (ilan konumu, yakındakileri bulma) | App Functionality |
| Location → Coarse Location (haritadaki yaklaşık pin) | App Functionality |
| Identifiers → Device ID (bildirim kimliği / FCM token) | App Functionality |
| Diagnostics → Crash Data (Firebase Crashlytics; yalnızca hesap kimliği) | App Functionality |
| Identifiers → User ID (hesap kimliği, çökme raporlarında) | App Functionality |

İşaretlenmeyecekler: Financial Info, Health, Contacts, Browsing/Search History, Purchases, Advertising Data,
Usage Data (ürün etkileşimi), Sensitive Info.

Privacy Policy URL: https://streetshelf.app/tr/privacy (API ile girildi).

## Google Play → Data safety

- Uygulama veri topluyor mu / paylaşıyor mu: **Toplar**; **üçüncü taraflarla paylaşmaz** (Firebase hizmet sağlayıcı
  olarak işlem yapar, Play bunu "paylaşım" saymaz).
- Veri **şifreli iletilir**: Evet (HTTPS).
- Kullanıcı **veri silme talep edebilir**: Evet, uygulama içinden (Ayarlar → Hesabı sil); web adresi: https://streetshelf.app/tr/privacy
- Toplanan veriler (hepsi: toplanır, paylaşılmaz, isteğe bağlı değil, amaç **App functionality**):
  - Personal info: Email address, Name
  - Location: Approximate location, Precise location
  - Photos and videos: Photos
  - Messages: Other in-app messages
  - App info and performance: Crash logs
  - Device or other IDs: Device or other IDs (bildirim token'ı)
- Toplanmayanlar: Financial info, Health and fitness, Contacts, Audio, Files and docs, Calendar, Web browsing.

## Google Play → diğer beyanlar

- **App access:** Kısıtlı. Giriş: `review@streetshelf.app`, kod `docs/store-listing.md` bölüm 3 (Keychain
  `streetshelf-review-code`). Talimat: "E-posta alanına adresi yaz, kod ekranına verilen kodu gir; kod e-postayla gelmez."
- **Reklam:** Hayır.
- **Hedef kitle:** 18 ve üzeri.
- **İçerik derecelendirmesi (IARC):** Kategori "Sosyal / iletişim" ya da "Referans, haber, eğitim" değil, **Diğer
  uygulama**; kullanıcı içeriği paylaşımı **Evet**, konum paylaşımı **Evet (kullanıcıya gösterilmez)**, şiddet/cinsellik/
  kumar/uyuşturucu **Hayır**, satın alma **Hayır**.
- **Haber uygulaması / COVID / devlet uygulaması:** Hayır.
- **Finansal özellikler:** Yok (ödeme uygulamada değil).
- **Kategori:** Yaşam tarzı. **Fiyat:** Ücretsiz.
- **Gizlilik politikası URL:** https://streetshelf.app/tr/privacy
