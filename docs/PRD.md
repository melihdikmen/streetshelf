# NeighborLend — PRD v3.1 (MVP)

v3.0'ın üzerine, geliştirmeye başlamadan önce kapatılması gereken boşluklar eklendi.
Değişen/eklenen bölümler **[v3.1]** ile işaretli.

## 1. Ürün özeti

Mahalle ve kapalı site ölçeğinde eşyaları **hediye etme (GIFT)**, **ücretsiz ödünç verme
(LEND)** ve **günlük kiralama (RENT)** imkanı sunan; kullanıcıların **ihtiyaç ilanı (WANTED)**
da açabildiği çift yönlü hiper-lokal imece ağı.

## 2. 3x2 matris

|            | GIFT 🎁 | LEND 🤝 | RENT 🏷️ |
|------------|--------|--------|--------|
| **OFFER**  | "Bebek arabası, hediye" | "Çadır, hafta sonu ödünç" | "Matkap, ₺150/gün" |
| **WANTED** | "Çocuk bisikleti arıyoruz, hediye olursa" | "2 günlük çadır lazım" | "El arabası, günlük ₺100'e kadar" |

**[v3.1] WANTED ilanında `price_per_day`**, talep edenin ödemeye razı olduğu **üst sınırdır**.

## 3. Erişim modeli

- **Konum bazlı**: 500 m / 1 km / 2 km / 5 km yarıçap. Herkese açık ilanlar.
- **Grup bazlı**: 6 haneli davet koduyla girilen kapalı gruplar. MVP'de bir ilan **tek bir**
  gruba bağlanır. **[v3.1]**
- **[v3.1] Konum gizliliği**: Tam koordinat DB'de tutulur, istemciye **asla** dönmez. Feed'e
  sadece 50 m'ye yuvarlanmış mesafe gider (`nearby_items` RPC). Grup ilanları da konum ister;
  kart aynı mesafe etiketini gösterir.

## 4. İşlem akışı **[v3.1 — tamamen netleştirildi]**

`Transaction` her zaman **owner** (eşya elinde olan) → **borrower** (eşyayı alan) yönündedir,
ilanı kimin açtığından bağımsız:

- **OFFER ilanı**: borrower isteği başlatır, owner onaylar.
- **WANTED ilanı**: owner ("bende var") başlatır, ilan sahibi (borrower) onaylar.
- `initiated_by` alanı kimin başlattığını tutar; **başlatmayan taraf** onaylar/reddeder.

Durumlar: `PENDING → ACCEPTED → DELIVERED → RETURNED`; yan çıkışlar `REJECTED`, `CANCELLED`.

| Adım | Kim | Ne olur |
|------|-----|---------|
| İstek | başlatan | `PENDING`, sohbete REQUEST kartı düşer |
| Onay | diğer taraf | `ACCEPTED`, ilan `RESERVED` olur |
| Teslim fotoğrafı | **owner** | `DELIVERED`; GIFT ise ilan `COMPLETED`, akış biter |
| İade fotoğrafı | **owner** | `RETURNED`; ilan tekrar `ACTIVE` |
| İptal | iki taraf | `PENDING`/`ACCEPTED` iken; ilan `ACTIVE`'e döner |

Aynı (ilan, çift) için aynı anda **tek açık işlem** olabilir (partial unique index).

**[v3.1] Ödeme**: Uygulama içi ödeme **yok** (indie kararı). RENT ücreti buluşmada elden
ödenir; uygulama yalnızca `total_amount` (gün × günlük ücret, istek anında snapshot)
gösterir. `payment_status` kolonu ileride bir PSP için yer tutucu olarak duruyor.

## 5. Sohbet **[v3.1 — mesaj tipleri eklendi]**

Her sohbet bir ilana bağlıdır (`conversations(item_id, requester_id)` tekil). Mesaj türleri:

- `TEXT` — kullanıcı yazar (istemci sadece bunu insert edebilir).
- `REQUEST` — istek kartı; Onayla/Reddet ya da Bekliyor/İptal.
- `SYSTEM` — durum değişimi satırı ("Ayşe isteği onayladı").
- `PICKUP_PHOTO` / `RETURN_PHOTO` — teslim/iade fotoğrafı kartı.

Kartlar `transaction_id` taşır ve her zaman **canlı** durumu gösterir. Realtime: `messages`
ve `transactions` tabloları yayında.

## 6. Güven ve güvenlik **[v3.1]**

- Giriş sadece e-posta kodu ile; telefon/SMS kullanılmaz (SMS maliyeti). Telefon numarası hiç toplanmaz.
- `blocks` (engelle) ve `reports` (şikayet et): App Store 1.2 gereği MVP'de zorunlu.
- Fotoğraf kovaları: `item-images` (public), `avatars` (public), `handover-photos` (private,
  sadece işlemin tarafları).

## 7. Ekranlar ve akışlar **[v3.1 — tam liste]**

**Onboarding**: Splash → Welcome → E-posta → 6 haneli kod (30 sn yeniden gönder) → Profil (ad + avatar)
→ Konum izni + yarıçap seçimi (500 m / 1 / 2 / 5 km) → Keşfet.

**Sekmeler**: Keşfet · Sohbet (okunmamış rozeti) · **İlan Ver** (ortada yükseltilmiş aksan
buton) · Gruplar · Profil.

1. **Keşfet** — konum + yarıçap + arama; grup kapsamı çipleri; Sokaktaki Eşyalar |
   Komşu İhtiyaçları; Tümü/Hediye/Ödünç/Kiralık; 2 sütun kart (WANTED tek sütun). İlk
   yüklemede iskelet, boşta yönlendirici empty state.
2. **Arama** — boş ekran yok: son aramalar + popüler; sonuç yoksa "İhtiyaç ilanı aç".
3. **İlan detayı** — galeri (nokta göstergeli), rozet + mesafe, sahip, grup notu, açıklama,
   şikayet. CTA thumb zone'da; metni matrise göre ("Sahiplenmek istiyorum" / "Ödünç
   istiyorum" / "Kiralamak istiyorum" / "Bende var, verebilirim"). RESERVED ise pasif.
   **Sahip görünümü**: "Senin ilanın · N istek" şeridi, Düzenle + Arşivle.
4. **İstek gönder (modal)** — hızlı çipler (Bugün / Yarın / Hafta sonu) + 14 günlük tarih
   şeridi (GIFT tek gün); not; özet (gün × ücret = toplam); gönderince kutlama → sohbet.
5. **İlan ver** — yön → mod → fotoğraf (galeri, 6 adet, ilki kapak) → başlık/açıklama →
   (RENT) ücret → görünürlük (herkes / grup). Yayınlayınca kutlama ekranı.
6. **Sohbet listesi** ve **Sohbet** — üstte ilan şeridi; baloncuklar + işlem kartları
   (REQUEST: Onayla/Reddet ya da Bekliyor/İptal; SYSTEM satırı; PICKUP/RETURN fotoğraf
   kartı); sağ üst menü → şikayet/engelle.
7. **Kamera (tam ekran)** — teslim / iade fotoğrafı; vizör + büyük deklanşör; galeri
   yedeği; önizleme → "Bu fotoğrafı kullan".
8. **İşlemlerim** — Devam eden | Geçmiş; her satırda 4 adımlı durum çizgisi (GIFT'te 3).
9. **Gruplar** — kartlar (kod büyük); **Gruba katıl** (kod girişi) ve **Grup oluştur**
   (ad → üretilen kod, kopyala/paylaş, kutlama); **Grup detayı** (kod, ilanlar, üyeler,
   ayrıl).
10. **Profil** — istatistik, İşlemlerim bağlantısı, ilanlarım, ayarlar.
11. **Ayarlar** — dil, bildirim, varsayılan mesafe, engellenenler, koşullar, çıkış,
    hesabı sil.
12. **Şikayet et (modal)** — sebep listesi, detay, "bu kişiyi de engelle".

Ortak durumlar: iskelet yükleme, boş durum (ikon + neden + ne yapmalı + CTA), toast
onayı, kutlama ekranı (peak moment: yay animasyonlu onay işareti).

## 8. MVP sonrası **[v3.1 — tasarımı yapıldı, backend yok]**

Aşağıdakiler mock veriyle tasarlandı; her biri backend'e bağlanmadan önce ürün kararı
ister (ödeme sağlayıcı seçimi, komisyon oranı, puanlama kuralları).

1. **Ödeme (ertelendi)** — Uygulama içi ödeme/provizyon ve cüzdan **kapsam dışı**: indie
   geliştirici olarak PSP sözleşmesi ve komisyon altyapısı bu aşamada kurulmayacak. RENT
   ücreti buluşmada elden ödenir; istek ekranı ve işlem kartı bunu açıkça söyler
   ("Elden ödeme"). Tasarım daha önce yapılıp kaldırıldı; DB'deki `payment_status` kolonu
   ileride bir PSP gelirse kullanılmak üzere duruyor.
3. **Puanlama** — RETURNED (GIFT'te DELIVERED) sonrası sohbet kartında ve İşlemlerim'de
   "Değerlendir": 5 yıldız, hızlı etiketler (Dakik, Özenli, İletişimi iyi, Tarif edildiği
   gibi, Esnek), yorum, kutlama. Herkese açık profil (`user/[id]`): puan, üyelik yılı,
   ilanlar, değerlendirmeler; tam liste (`reviews/[userId]`) dağılım çubuklarıyla. İlan
   detayında sahibin puanı.
4. **Harita görünümü** — Keşfet'te liste/harita geçişi (expo-maps). Pinler moda göre renkli,
   yalnızca **yaklaşık** konum (sunucuda ~100 m bulanıklaştırılmış); pin'e dokununca alt
   kart, karttan ilana geçiş. "Yaklaşık konum" rozeti sürekli görünür.
5. **Çoklu grup görünürlüğü** — İlan ver'de grup çipleri çoklu seçim; kartta "Grup +1".
   Veri modelinde `groups: Group[]` (DB'de `item_groups` ara tablosu gerekecek).
6. **Müsaitlik takvimi** — Sahip için aylık takvim (`availability/[itemId]`): kapalı
   günler (siyah), rezerve günler (yeşil, kilitli), geçmiş günler pasif. İstek ekranındaki
   tarih şeridi bu günleri seçilemez gösterir ve aralık kapalı günün üzerinden atlayamaz.
7. **Paylaşım** — İlan detayında paylaş butonu; `https://neighborlend.app/i/<id>` bağlantısı
   (web sayfası ayrı iş).

## 9. Veri modeli

Kaynak: `supabase/migrations/0001_init.sql`. İstemci tipleri: `src/types/domain.ts`.
