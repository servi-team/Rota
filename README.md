# Koçluk — YKS 2027 takip paneli

YKS 2027'ye hazırlanan bir öğrencinin **günlük soru sayısını, çalışma süresini, ders dağılımını ve deneme netlerini** takip etmek için lokal çalışan, tek dosyalık veritabanı kullanan bir panel.

- Bağımlılık yok, `npm install` gerekmez (Node.js'in yerleşik `node:sqlite` modülünü kullanır).
- Tüm veriler bilgisayarda: `data/kocluk.db`
- İnternete hiçbir şey gönderilmez.
- Arayüz Türkçe, masaüstü ve telefon boyutuna uyumlu.

## Hızlı başlangıç

Gereken: **Node.js 24 veya üzeri** (`node -v` ile kontrol et).

```bash
cd kocluk
npm start
```

Ardından tarayıcıda **http://localhost:5173** adresini aç.

Durdurmak için terminalde `Ctrl + C`. İlk çalıştırmada `data/kocluk.db` otomatik oluşturulur ve TYT/AYT dersleri hazır gelir. TYT fen bilimleri **fizik, kimya ve biyoloji** olarak ayrı takip edilir.

### Telefondan aynı Wi-Fi'da açmak

```bash
HOST=0.0.0.0 npm start
```

Bilgisayarın yerel IP'sini bul (`hostname -I`), telefondan `http://<bilgisayar-ip>:5173` aç. Bu modda aynı ağdaki herkes panele erişebilir; internet'e açık bir sunucuda kullanma.

## Ne takip ediliyor?

| Veri | Nerede | Ne işe yarar |
| --- | --- | --- |
| Çalışma süresi (dk) | Bugün | Günlük/haftalık hedef ve süre trendi |
| Ders bazlı soru | Bugün | Hangi derse ne kadar zaman/soru ayrıldığı |
| Doğru / yanlış (opsiyonel) | Bugün | Günlük yaklaşık net ve isabet |
| Ruh hali (1–5) + not | Bugün | Haftalık görüşmede bağlam; "neden düştü?" |
| Denemeler | Denemeler | TYT/AYT net trendi, ders bazlı net, son 3 ortalama |
| Hedefler | Ayarlar | Günlük soru/süre, haftalık soru/süre |

Panel otomatik olarak şunları hesaplar:

- Günlük ve haftalık hedef yüzdesi
- Kesintisiz çalışma serisi (streak)
- 7 / 30 / 90 günlük soru ve süre grafikleri, günlük ortalama
- Ders dağılımı ve son 24 haftanın ısı haritası
- Deneme net trendi + son denemenin önceki denemeye göre değişimi

> Net formülü: **doğru − yanlış / 4**. Günlük net, o gün girilen tüm derslerin toplamıdır; asıl ölçü deneme netleridir.

## Önerilen koçluk sistemi

Uygulamayı doldurmak için değil, **karar vermek için** kullan. Önerilen düzen:

### 1. Tek bir hedef ve geriye dönük plan

- Hedef bölüm + hedef sıralama aralığını netleştir (ör. "ilk 20 bin").
- Bu hedefin gerektirdiği yaklaşık TYT/AYT netlerini not et.
- Konu bitirme takvimini aylara böl; her ayın sonunda "hangi konular bitti?" diye kontrol et.
- Paneldeki hedefler bu planın **günlük görünür yüzü** olsun.

### 2. Haftalık plan

- 6 gün çalışma + 1 gün deneme/telafi.
- Her gün 2–3 ders; bir günde 6 derse dağılmak yerine derinleşmek daha verimli.
- Haftalık hedefi günlük hedefin 6 katı civarında tut (1 dinlenme günü payı).
- Başlangıç örneği: günde **120 soru / 4 saat**, haftada **800 soru / 25 saat**, haftada **1 TYT + 1 AYT** denemesi. 2 haftada bir %10–15 artır.

### 3. Günlük ritüel (5 dakika)

- **Sabah (2 dk):** bugün hangi dersler, kaç soru, kaç saat? Tek bir "günün odağı" belirle.
- **Akşam (2–3 dk):** Bugün sekmesine süreyi ve ders sorularını gir; istersen doğru/yanlış ve ruh halini ekle. Not alanına sadece bir cümle: "Yarın için tek odak..."
- Giriş 3 dakikayı geçmesin. Uzun form doldurma alışkanlığı bir süre sonra bırakılır.

### 4. Haftalık koçluk görüşmesi (20 dakika)

Her hafta aynı gün, aynı saatte. Gündem:

1. **Veriler (5 dk):** Geçmiş → son 7 gün; toplam soru/süre, aktif gün, ders dağılımı, haftalık hedef yüzdesi.
2. **Denemeler (5 dk):** Net trendi; son denemenin ders bazlı netleri; hangi ders düşüyor?
3. **İyi giden 2 şey, gelişmesi gereken 1 şey (5 dk):** Öğrenci söylesin, koç not alsın.
4. **Gelecek hafta (5 dk):** Tek bir ölçülebilir hedef + gerekirse plan değişikliği.

Hedef tutmadıysa ceza yok; **neden** tutmadığına bak. Hedef sürekli tutuyorsa hedefi yükselt.

### 5. Hangi metriğe bakmalı?

- **Aktif gün oranı:** Disiplinin en dürüst göstergesi. 30 günde 20+ gün iyi bir başlangıç.
- **Günlük ortalama soru/süre:** Tek günlük rekorlar değil, sürdürülebilir ortalama.
- **Deneme net trendi:** Asıl performans göstergesi. Soru sayısı artarken net düşüyorsa verim sorunu vardır.
- **Ders dağılımı:** Zayıf derse yeterli pay ayrılıyor mu? Sadece sevilen derse çalışmak tipik tuzaktır.
- **Ruh hali:** 1–2'lerin arttığı haftalarda yükü azaltmak, tükenmeyi önler.

> Soru sayısı tek başına yarış değildir. Kolay soru avcılığı soru sayısını şişirir; bu yüzden deneme netleri ve yanlış analizi ana ölçü olmalı.

### 6. Deneme analizi

Denemeyi girdikten sonra 5 dakika ayır:

- Hangi derste net düştü?
- Yanlışlar bilgi eksikliği mi, dikkat hatası mı, süre mi?
- Boş bırakılan sorular hangi konulardan?
- Aynı hata iki denemede tekrar ediyor mu? Not alanına yaz.

Panelde deneme kartına tıklayınca ders bazlı netler açılır.

### 7. Motivasyon

- Seri (streak) ve görünür grafikler iyi çalışır; ceza/utandırma değil.
- Küçük ödüller koy: haftalık hedef tutunca sevdiği bir şey.
- "Kötü gün" kayıtlarını silme; veri olarak kalsın. Koç için en değerli günler onlar.

### 8. Haftalık değerlendirme şablonu

```text
Hafta: ............
Hedef: ....... soru / ....... saat      Gerçekleşen: ....... / .......
Aktif gün: .... / 7
Deneme: TYT ....... net · AYT ....... net

İyi giden 2 şey:
1.
2.

Geliştirilecek 1 şey:

Önümüzdeki haftanın tek hedefi:

Koç notu:
```

## Kullanım akışı

1. **Bugün:** Tarih bugünde → süreyi ve ders sorularını gir → **Kaydet** (`Ctrl + Enter`).
2. **Geçmiş:** 7/30/90 gün seç; grafikler, ders dağılımı ve günlük tablo. Bir güne tıklayınca düzenlemek için Bugün sekmesinde açılır.
3. **Denemeler:** Tarih, tür, ders bazlı doğru/yanlış/boş gir → net otomatik. Net trendi TYT/AYT olarak filtrelenir.
4. **Ayarlar:** İsim, günlük/haftalık hedefler, ders listesi, CSV indirme.

Kaydedilmemiş değişiklik varken başka güne geçmeye çalışırsan panel uyarır.

## Yedekleme ve veri

- Veritabanı: `data/kocluk.db` (yanında `-wal` ve `-shm` dosyaları oluşabilir).
- **Yedek:** Sunucuyu durdur (`Ctrl + C`), `data/kocluk.db` dosyasını kopyala. İstersen haftalık olarak farklı bir klasöre kopyala.
- **Excel:** Ayarlar → **CSV indir**. Dosya `;` ayraçlı ve UTF-8 BOM'ludur; Türkçe Excel'de doğrudan açılır.
- **Sıfırlama:** Sunucu kapalıyken `data/kocluk.db` dosyasını sil; bir sonraki açılışta boş veritabanı oluşur. Önce yedek al.

## Teknik yapı

```text
server.js          Node HTTP sunucusu + API + statik dosyalar
db.js              SQLite şeması, sorgular, istatistikler
public/index.html  Arayüz
public/styles.css  Tema ve responsive tasarım
public/app.js      İstemci mantığı (bağımlılıksız)
data/kocluk.db     Veriler (otomatik oluşur, .gitignore'da)
```

Tablolar: `settings`, `subjects`, `days`, `day_subjects`, `exams`, `exam_results`.

API uçları:

```text
GET    /api/bootstrap          ayarlar + dersler + bugün
GET    /api/days?from&to       gün listesi
GET    /api/days/:date         gün detayı
PUT    /api/days/:date         gün kaydet
GET    /api/stats?days=30      özet + seri + grafik verisi
GET    /api/exams              denemeler
POST   /api/exams              deneme ekle
DELETE /api/exams/:id          deneme sil
GET    /api/subjects           dersler
POST   /api/subjects           ders ekle
DELETE /api/subjects/:id       ders sil (kaydı varsa engellenir)
PUT    /api/settings           hedefler
GET    /api/export.csv         CSV yedeği
```

Port değiştirmek için: `PORT=5174 npm start`

## Sonraki adımlar (isteğe bağlı)

- Konu/tekrar tamamlama takibi (ders → konu → bitiş tarihi)
- Haftalık plan tablosu ve hatırlatmalar
- Çoklu öğrenci + basit giriş
- PDF haftalık rapor
- Grafikleri görsel olarak dışa aktarma
