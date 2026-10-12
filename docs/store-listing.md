# StreetShelf — Mağaza metinleri (App Store + Google Play)

Sürüm 1.0.0 için. Her metin uygulamada gerçekten olan bir özelliği anlatır; yeni bir özellik
eklendiğinde ya da biri kaldırıldığında bu dosya da değişir. Karakter sayıları sınırların
altında olduğu kontrol edilerek yazıldı (Apple ve Google sınırı karakter sayar, bayt değil).

Kaynak: `docs/PRD.md`, `AGENTS.md`, uygulama kodu (yarıçaplar `app/radius.tsx`).

## Kontrol edilen gerçekler (metinler bunlara dayanır)

- Üç mod: hediye (GIFT), ücretsiz ödünç (LEND), günlük kiralık (RENT); her biri hem "veriyorum"
  (OFFER) hem "arıyorum" (WANTED) ilanı olabilir.
- Görünürlük: herkese açık ilanlar 500 m / 1 km / 2 km / 5 km yarıçapta; ya da 6 haneli davet
  koduyla girilen kapalı gruplarda. Bir ilan birden çok grupta görünebilir.
- Konum gizliliği: tam konum hiçbir kullanıcıya gösterilmez; listede yuvarlanmış mesafe, haritada
  ~100 m bulanıklaştırılmış yaklaşık pin.
- Akış: istek → onay → teslim fotoğrafı → iade fotoğrafı; hepsi ilana bağlı sohbette kart olarak.
  Teslim fotoğraflarını yalnızca işlemin iki tarafı görür.
- Kiralık ücreti buluşmada elden ödenir; uygulamada ödeme, cüzdan ya da komisyon yok. Uygulama
  yalnızca gün × günlük ücret toplamını gösterir.
- İşlem bitince karşılıklı değerlendirme (5 yıldız, etiketler, yorum); herkese açık profilde puan.
- Sahip için müsaitlik takvimi (kapalı günler istekte seçilemez).
- Giriş yalnızca e-postaya gelen 6 haneli kodla; şifre yok, telefon numarası istenmez.
- Bildirimler (istek, onay, mesaj), engelleme, şikayet, uygulama içinden hesap silme.
- Dil: Türkçe ve İngilizce.

Yazılmayanlar (bilerek): takas, uygulama içi ödeme, sigorta/depozito, kimlik doğrulama,
kargo, "binlerce kullanıcı" gibi sayılar, ilan bağlantısının web'de açılması (`/i/<id>` sayfası
henüz yok).

---

## 1. Türkçe (tr-TR)

### Uygulama adı

| Mağaza | Metin | Krk / sınır |
|---|---|---|
| App Store adı | StreetShelf: Komşunla Paylaş | 28 / 30 |
| Google Play başlığı | StreetShelf: Komşunla Paylaş | 28 / 30 |

### Alt başlık (App Store, 30)

> Komşudan ödünç al, hediye et

28 / 30

### Kısa açıklama (Google Play, 80)

> Komşunla eşya ödünç al, hediye et ya da kirala. Yakınındakilerle paylaş.

72 / 80

### Tanıtım metni (App Store, 170 — sürüm göndermeden değişebilir)

> Matkap bir kere lazım, çadır bir hafta sonu. Satın alma; komşundan ödünç al. Kullanmadığın
> eşyayı da hediye et ya da günlük kirala.

### Anahtar kelimeler (App Store, 100)

Lux (T-3) ile belirlendi. Ad ve alt başlıkta geçen kelimeler (paylaş, komşu*, ödünç, hediye)
tekrar edilmedi; Apple bunları zaten birleştiriyor. "takas" uygulamada olmadığı için çıkarıldı.

```
kiralık,kirala,ikinci el,eşya,bedava,mahalle,apartman,yakınımda,matkap,alet,çadır,bisiklet,komşu
```

### Uzun açıklama (her iki mağaza, 4000)

```
StreetShelf, komşunla eşya paylaşmanın en kolay yolu. Bir kere lazım olan şeyi satın alma: komşundan ödünç al, kullanmadığın eşyayı hediye et ya da günlük kiraya ver. Hepsi sokağında, sitende, mahallende.

Matkap, çadır, bebek arabası, el arabası, bisiklet… Evde duran her şey yan apartmanda birinin işine yarar.

ÜÇ YOL, İKİ YÖN
• Hediye: artık kullanmadığın eşyayı bir komşuna ver.
• Ödünç: ücretsiz ver, işi bitince geri alsın.
• Kiralık: günlük ücretini sen belirle.
Aradığın şey yoksa ihtiyaç ilanı aç: "2 günlük çadır lazım" de, elinde olan komşun sana yazsın.

YAKININDAKİLER YA DA SADECE TANIDIKLARIN
• Konuma göre: 500 m, 1 km, 2 km ya da 5 km içindeki ilanları gör; liste ya da harita.
• Kapalı grup: sitene, apartmanına ya da arkadaşlarına özel bir grup kur, 6 haneli davet koduyla davet et. Grup ilanlarını yalnızca üyeler görür.

KONUMUN SENDE KALIR
Tam adresin hiç kimseye gösterilmez. Listede yalnızca yaklaşık mesafe, haritada yaklaşık 100 metre kaydırılmış bir pin görünür. Buluşma yerini sohbette sen belirlersin.

İSTEKTEN İADEYE, HER ŞEY SOHBETTE
• Tarihleri seç, isteğini gönder; eşya sahibi tek dokunuşla onaylar.
• Teslimde ve iadede eşyanın fotoğrafı çekilir; ne durumda verildiği ve geri geldiği kayıtlı kalır. Bu fotoğrafları yalnızca siz ikiniz görürsünüz.
• Her adım bildirim olarak gelir.
• Eşyanın müsait olmadığı günleri takvimden kapat.

GÜVEN
• İşlem bitince birbirinizi değerlendirin; puanlar herkese açık profilde görünür.
• Rahatsız eden birini engelle ya da şikayet et.
• Şifre yok: e-postana gelen 6 haneli kodla giriş yap. Telefon numaran istenmez.
• Hesabını istediğin an uygulamanın içinden silebilirsin.

KOMİSYON YOK
Kiralık ücretini buluşmada elden ödersiniz. StreetShelf'te ödeme, cüzdan ya da kesinti yoktur; uygulama yalnızca gün × günlük ücret toplamını gösterir.

Türkçe ve İngilizce kullanılabilir.

Sorular ve öneriler: support@streetshelf.app
Gizlilik politikası ve kullanım koşulları: streetshelf.app
```

### Yeni neler var (1.0.0)

> StreetShelf'in ilk sürümü. Komşunla eşya ödünç al, hediye et ya da kirala; yakınındaki
> ilanları gör ya da sitene özel bir grup kur. Görüşün bizim için çok değerli:
> support@streetshelf.app

---

## 2. English (en-US)

### App name

| Store | Text | Chars / limit |
|---|---|---|
| App Store name | StreetShelf: Borrow & Share | 27 / 30 |
| Google Play title | StreetShelf: Borrow & Share | 27 / 30 |

### Subtitle (App Store, 30)

> Gift & rent with neighbors

26 / 30

### Short description (Google Play, 80)

> Borrow, gift or rent things from neighbors nearby. Share what you own.

70 / 80

### Promotional text (App Store, 170)

> Need a drill once, a tent for one weekend? Don't buy it, borrow it from a neighbor. And give
> away or rent out the things you rarely use.

### Keywords (App Store, 100)

With Lux (T-3). Words already in the name and subtitle (borrow, share, gift, rent, neighbors)
are left out. "swap" removed: the app has no swapping.

```
lend,free,local,nearby,tools,community,giveaway,things,drill,bike,camping,neighbor,borrowing
```

### Full description (both stores, 4000)

```
StreetShelf is the easiest way to share things with your neighbors. Don't buy what you need once: borrow it from someone down the street, give away what you no longer use, or rent it out by the day. All within your street, your building or your neighborhood.

A drill, a tent, a stroller, a wheelbarrow, a bike… Whatever sits in your closet is exactly what someone next door needs this weekend.

THREE WAYS, TWO DIRECTIONS
• Gift: give something you no longer need to a neighbor.
• Lend: lend it for free and get it back when they're done.
• Rent: set your own daily price.
Can't find it? Post a request — "need a tent for 2 days" — and a neighbor who has one gets in touch.

NEARBY, OR JUST PEOPLE YOU KNOW
• By location: see listings within 500 m, 1 km, 2 km or 5 km, as a list or on a map.
• Private groups: start a group for your building, your complex or your friends and invite them with a 6-digit code. Only members see group listings.

YOUR LOCATION STAYS YOURS
Your exact address is never shown to anyone. Lists show an approximate distance and the map shows a pin moved about 100 metres. You agree on where to meet in the chat.

FROM REQUEST TO RETURN, ALL IN THE CHAT
• Pick your dates and send a request; the owner accepts with one tap.
• A photo is taken at pickup and at return, so how the item left and came back is on record. Only the two of you can see these photos.
• Every step arrives as a notification.
• Owners can block out days when the item isn't available.

TRUST
• Rate each other when you're done; ratings show on public profiles.
• Block or report anyone who bothers you.
• No passwords: sign in with a 6-digit code sent to your email. We never ask for your phone number.
• Delete your account from inside the app at any time.

NO FEES
Rent is paid in cash when you meet. StreetShelf has no payments, no wallet and takes no cut; the app just shows the total (days × daily price).

Available in English and Turkish.

Questions and ideas: support@streetshelf.app
Privacy policy and terms: streetshelf.app
```

### What's new (1.0.0)

> The first release of StreetShelf. Borrow, gift or rent things with your neighbors; browse
> listings nearby or start a private group for your building. We'd love your feedback:
> support@streetshelf.app

---

## 3. İnceleme notu / Review notes

Apple "App Review Information → Notes" ve Google Play "App access" için. İngilizce verilir
(inceleme ekipleri İngilizce okur).

**Karar verildi (2026-10-12, sahip):** inceleme ekibi `review@streetshelf.app` adresiyle, sunucuda
tutulan sabit bir kodla girer (`review-login` edge function, 0014; en fazla 5 yanlış denemede 15 dakika
kilit). Kod bu dosyada **durmaz**: macOS Keychain'de `streetshelf-review-code`. Mağazaya girerken
`{{REVIEW_CODE}}` yerine konur (App Store Connect'te "Sign-in required" alanına ve Play "App access"
bölümüne). İnceleme bitince `npx supabase secrets unset REVIEW_CODE` ile kapatılır.

```
StreetShelf is a neighborhood sharing app: people gift, lend (free) or rent items to each other within a GPS radius or inside private invite-code groups.

SIGN-IN
There are no passwords. Enter an email address and type the 6-digit code that arrives by email.
Demo account: review@streetshelf.app
Code: {{REVIEW_CODE}}  (this account is signed in with this fixed code instead of an emailed one; type it on the code screen)
First sign-in walks through a short onboarding: pick any display name and allow or skip location. No other setup is needed.

WHAT TO TRY
1. Discover tab: public listings near the device location (list or map; the area may be empty while the app is new, the demo group below always has content). Map pins are deliberately approximate (~100 m); exact locations are never sent to devices.
2. Open a listing and send a request; the conversation shows the request card.
3. Groups tab: the demo account is already a member of "StreetShelf Demo", a private group with three sample listings (lend, rent, gift). Open one and send a request.
4. Create a listing from the + tab (photo, title, GIFT / LEND / RENT), then edit or archive it from Profile.
5. Profile → Settings: block list, report, terms/privacy, and Delete account (in-app account deletion).

PAYMENTS
There are no in-app payments or digital goods. For RENT listings the price is paid in cash between the two people when they meet; the app only shows the total.

USER-GENERATED CONTENT (Guideline 1.2)
Listings, chats and public profiles have Report (with an option to also block the person); users can block others from a chat menu, and Settings lists blocked users. Reports are reviewed within 48 hours.

PERMISSIONS
Location: to show listings nearby (asked during onboarding). Camera/Photos: listing photos and handover photos. Notifications: asked only after the first listing or request, never at launch.

Contact: support@streetshelf.app
```

> `48 hours` (karar: 2026-10-12, Nova) taahhüttür: şikayetler `reports` tablosuna düşer, otomatik bir bildirim
> yok. Sahip gerçekçi bir süre (ör. 24 saat) seçip nasıl takip edeceğine karar vermeden doldurulmamalı.

---

## 4. Google Play ek alanları

- **Kategori:** Yaşam Tarzı (Lifestyle). Alternatif: Sosyal.
- **Etiketler (Play):** Topluluk, Paylaşım, Yerel.
- **İletişim e-postası:** support@streetshelf.app · **Web sitesi:** https://streetshelf.app
- **Gizlilik politikası:** https://streetshelf.app (TR/EN sayfaları; `LEGAL_BASE_URL`).
- **Veri güvenliği formu için not:** e-posta, ad, profil fotoğrafı, yaklaşık ve tam konum
  (tam konum sunucuda tutulur, başkalarına gösterilmez), fotoğraflar, mesajlar, cihaz bildirim
  kimliği, çökme raporları (Firebase Crashlytics, yalnızca hesap kimliği). Satın alma verisi yok.
