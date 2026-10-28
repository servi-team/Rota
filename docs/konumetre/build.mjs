import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const logo = readFileSync(join(root, "public", "logo.png")).toString("base64");



const TYT = {
  turkce: {
    name: "Türkçe",
    desc: "Sözcükten paragrafa, dil bilgisinden anlatım bozukluğuna. Paragrafı günlük rutine al.",
    note: "40 soru",
    topics: [
      "Sözcükte Anlam",
      "Cümlede Anlam",
      "Paragrafta Anlam ve Yapı",
      "Paragrafta Ana / Yardımcı Düşünce",
      "Ses Bilgisi",
      "Yazım Kuralları",
      "Noktalama İşaretleri",
      "Sözcükte Yapı (Kök–Ek)",
      "Sözcük Türleri",
      "Fiiller ve Fiil Çatısı",
      "Fiilimsiler",
      "Cümlenin Ögeleri",
      "Cümle Türleri",
      "Anlatım Bozuklukları",
    ],
  },
  matematik: {
    name: "Temel Matematik",
    desc: "Temel kavramlardan problemlere, kümelerden olasılığa. TYT matematik 40 sorusunun yaklaşık 10'u geometri.",
    note: "~30 soru",
    topics: [
      "Temel Kavramlar",
      "Sayı Basamakları",
      "Bölme ve Bölünebilme",
      "EBOB – EKOK",
      "Rasyonel ve Ondalık Sayılar",
      "Basit Eşitsizlikler",
      "Mutlak Değer",
      "Üslü Sayılar",
      "Köklü Sayılar",
      "Çarpanlara Ayırma",
      "Oran – Orantı",
      "Birinci Dereceden Denklemler",
      "Sayı ve Kesir Problemleri",
      "Yaş Problemleri",
      "İşçi – Havuz Problemleri",
      "Hareket Problemleri",
      "Yüzde, Kâr – Zarar",
      "Karışım Problemleri",
      "Grafik ve Tablo Problemleri",
      "Kümeler",
      "Mantık",
      "Permütasyon – Kombinasyon",
      "Olasılık",
      "Veri ve İstatistik",
    ],
  },
  geometri: {
    name: "Geometri",
    desc: "Açılardan katı cisimlere. Şekilsiz soru çözme; her konuda temel çizimi kuralla.",
    note: "~10 soru",
    topics: [
      "Temel Geometrik Kavramlar",
      "Doğruda Açılar",
      "Üçgende Açılar",
      "Dik Üçgen ve Öklid",
      "İkizkenar ve Eşkenar Üçgen",
      "Açıortay – Kenarortay",
      "Üçgende Alan",
      "Üçgende Benzerlik",
      "Açı – Kenar Bağıntıları",
      "Çokgenler",
      "Özel Dörtgenler",
      "Çember ve Daire",
      "Katı Cisimler",
    ],
  },
  fizik: {
    name: "Fizik",
    desc: "Madde, hareket, enerji, elektrik ve optik. Formül ezberi değil, olayı kurma dersi.",
    note: "7 soru",
    topics: [
      "Fizik Bilimine Giriş",
      "Madde ve Özellikleri",
      "Sıvıların Kaldırma Kuvveti",
      "Basınç",
      "Isı, Sıcaklık ve Genleşme",
      "Hareket",
      "Kuvvet ve Newton Yasaları",
      "İş, Güç ve Enerji",
      "Elektrostatik",
      "Elektrik Akımı ve Devreler",
      "Manyetizma",
      "Dalgalar",
      "Optik",
    ],
  },
  kimya: {
    name: "Kimya",
    desc: "Kimya biliminden karışımlara. TYT kimya, temel kavramları hızlıca bitirip soruya dönülen bir ders.",
    note: "7 soru",
    topics: [
      "Kimya Bilimi",
      "Atom ve Periyodik Sistem",
      "Kimyasal Türler Arası Etkileşimler",
      "Maddenin Halleri",
      "Kimyasal Hesaplamalar",
      "Asitler, Bazlar ve Tuzlar",
      "Karışımlar",
      "Doğa ve Kimya",
      "Kimya Her Yerde",
    ],
  },
  biyoloji: {
    name: "Biyoloji",
    desc: "Hücreden ekosisteme. TYT biyoloji 6 soru; kavramları görsel ve tabloyla çalış.",
    note: "6 soru",
    topics: [
      "Canlıların Ortak Özellikleri",
      "Canlıların Temel Bileşenleri",
      "Hücre ve Organelleri",
      "Hücre Zarından Madde Geçişi",
      "Canlıların Sınıflandırılması",
      "Mitoz ve Eşeysiz Üreme",
      "Mayoz ve Eşeyli Üreme",
      "Kalıtım",
      "Ekosistem Ekolojisi",
      "Güncel Çevre Sorunları",
    ],
  },
  tarih: {
    name: "Tarih",
    desc: "İlk çağlardan inkılap tarihine. Olay–neden–sonuç zinciri kur; tarihleri değil dönemi öğren.",
    note: "5 soru",
    topics: [
      "Tarih ve Zaman",
      "İnsanlığın İlk Dönemleri",
      "Orta Çağ'da Dünya",
      "İlk ve Orta Çağlarda Türk Dünyası",
      "İslam Medeniyetinin Doğuşu",
      "Türklerin İslamiyet'i Kabulü",
      "Beylikten Devlete Osmanlı",
      "Osmanlı'da Devlet ve Toplum",
      "Osmanlı'da Değişim ve Diplomasi",
      "En Uzun Yüzyıl (19. yy)",
      "I. Dünya Savaşı ve Osmanlı",
      "Milli Mücadele",
      "Atatürkçülük ve Türk İnkılabı",
    ],
  },
  cografya: {
    name: "Coğrafya",
    desc: "Doğa, iklim, nüfus ve Türkiye. Harita ve grafik okuma, soruların yarısını çözer.",
    note: "5 soru",
    topics: [
      "Doğa ve İnsan",
      "Dünya'nın Şekli ve Hareketleri",
      "Harita Bilgisi",
      "Atmosfer ve Sıcaklık",
      "Basınç ve Rüzgârlar",
      "Nem ve Yağış",
      "İç ve Dış Kuvvetler",
      "Nüfus",
      "Yerleşme",
      "Türkiye'nin Coğrafi Konumu",
      "Doğal Afetler",
    ],
  },
  felsefe: {
    name: "Felsefe",
    desc: "Felsefenin alanları: bilgi, varlık, ahlak, sanat, din, siyaset ve bilim.",
    note: "5 soru",
    topics: [
      "Felsefenin Konusu ve Doğuşu",
      "Bilgi Felsefesi",
      "Varlık Felsefesi",
      "Ahlak Felsefesi",
      "Sanat Felsefesi",
      "Din Felsefesi",
      "Siyaset Felsefesi",
      "Bilim Felsefesi",
    ],
  },
  din: {
    name: "Din Kültürü",
    desc: "İnanç, ibadet, Kur'an, Hz. Muhammed ve ahlak. Kısa konular, düzenli tekrar ister.",
    note: "5 soru",
    topics: [
      "Bilgi ve İnanç",
      "İslam ve İbadet",
      "Kur'an ve Yorumu",
      "Hz. Muhammed ve Hayatı",
      "Ahlak ve Değerler",
    ],
  },
};

const AYT = {
  matematik: {
    name: "Matematik",
    desc: "Fonksiyondan integrale. AYT matematik 40 sorunun yaklaşık 10'u geometri; günde en az 1,5 saat.",
    note: "~30 soru",
    topics: [
      "Fonksiyonlar",
      "Polinomlar",
      "İkinci Dereceden Denklemler",
      "Karmaşık Sayılar",
      "Parabol",
      "Eşitsizlikler",
      "Permütasyon – Kombinasyon – Binom",
      "Olasılık",
      "Trigonometri",
      "Trigonometrik Denklemler",
      "Logaritma",
      "Diziler",
      "Limit ve Süreklilik",
      "Türev ve Uygulamaları",
      "İntegral ve Alan",
    ],
  },
  geometri: {
    name: "Geometri",
    desc: "Üçgenden analitiğe. AYT geometri, matematik netini en hızlı yükselten alanlardan biri.",
    note: "~10 soru",
    topics: [
      "Doğruda ve Üçgende Açılar",
      "Özel Üçgenler",
      "Açıortay – Kenarortay",
      "Üçgende Alan ve Benzerlik",
      "Açı – Kenar Bağıntıları",
      "Çokgenler ve Dörtgenler",
      "Çember ve Daire",
      "Noktanın Analitiği",
      "Doğrunun Analitiği",
      "Çemberin Analitiği",
      "Dönüşüm Geometrisi",
      "Katı Cisimler",
    ],
  },
  fizik: {
    name: "Fizik",
    desc: "Vektörlerden modern fiziğe. AYT fizik 14 soru; mekanik ve elektrik ağırlıklı.",
    note: "14 soru",
    topics: [
      "Vektörler",
      "Kuvvet, Tork ve Denge",
      "Kütle Merkezi",
      "Basit Makineler",
      "Hareket",
      "Newton'un Hareket Yasaları",
      "İş, Güç ve Enerji",
      "İtme ve Momentum",
      "Atışlar",
      "Elektrik Alan ve Potansiyel",
      "Paralel Levhalar ve Sığa",
      "Manyetik Alan ve Kuvvet",
      "İndüksiyon ve Alternatif Akım",
      "Çembersel Hareket",
      "Kütle Çekim ve Kepler",
      "Basit Harmonik Hareket",
      "Dalga Mekaniği",
      "Atom Fiziği, Radyoaktivite ve Modern Fizik",
    ],
  },
  kimya: {
    name: "Kimya",
    desc: "Modern atomdan organik kimyaya. AYT kimya 13 soru; denge ve organik kimya belirleyici.",
    note: "13 soru",
    topics: [
      "Modern Atom Teorisi",
      "Gazlar",
      "Sıvı Çözeltiler ve Derişim",
      "Çözünürlük Dengesi (Kçç)",
      "Tepkimelerde Enerji",
      "Tepkimelerde Hız",
      "Kimyasal Denge",
      "Asit – Baz Dengesi",
      "Kimya ve Elektrik",
      "Karbon Kimyasına Giriş",
      "Hidrokarbonlar",
      "Fonksiyonel Gruplar",
      "Enerji Kaynakları ve Bilimsel Gelişmeler",
    ],
  },
  biyoloji: {
    name: "Biyoloji",
    desc: "Sistemlerden bitki biyolojisine. AYT biyoloji 13 soru; ezber değil, bağlantı dersi.",
    note: "13 soru",
    topics: [
      "Sinir Sistemi",
      "Endokrin Sistem",
      "Duyu Organları",
      "Destek ve Hareket Sistemi",
      "Sindirim Sistemi",
      "Dolaşım ve Bağışıklık",
      "Solunum Sistemi",
      "Boşaltım Sistemi",
      "Üreme Sistemi ve Embriyonik Gelişim",
      "Komünite ve Popülasyon Ekolojisi",
      "Nükleik Asitler",
      "Genetik Şifre ve Protein Sentezi",
      "Canlılık ve Enerji",
      "Fotosentez ve Kemosentez",
      "Hücresel Solunum",
      "Bitki Biyolojisi",
      "Bitkilerde Taşıma ve Hormonlar",
      "Canlılar ve Çevre",
    ],
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function head(section, right) {
  return `<header class="head">
    <div class="brand"><img src="data:image/png;base64,${logo}" alt=""><div><b>ROTA</b><span>Konumetre · YKS 2027</span></div></div>
    <div class="head-right"><span>${section}</span><b>${right}</b></div>
  </header>`;
}

function foot(no, label) {
  return `<footer class="foot"><span>YKS 2027 · SAYISAL</span><span>${label}</span><span class="pno">${String(no).padStart(2, "0")} / 13</span></footer>`;
}

function topicRows(topics) {
  return topics
    .map(
      (t, i) => `<tr>
        <td class="num">${String(i + 1).padStart(2, "0")}</td>
        <td class="topic">${esc(t)}</td>
        <td class="cell"><i class="tick"></i></td>
        <td class="cell"><i class="tick"></i></td>
        <td class="cell"><i class="tick"></i></td>
        <td class="cell"><i class="tick"></i></td>
      </tr>`
    )
    .join("");
}

function table(topics, rh = 7.5) {
  return `<table class="konu${rh >= 11 ? " large" : ""}" style="--rh:${rh}mm">
    <thead>
      <tr>
        <th class="num">#</th>
        <th class="topic">Konu</th>
        <th class="res"><span class="rn">1</span><i class="wline"></i></th>
        <th class="res"><span class="rn">2</span><i class="wline"></i></th>
        <th class="res"><span class="rn">3</span><i class="wline"></i></th>
        <th class="res"><span class="rn">4</span><i class="wline"></i></th>
      </tr>
    </thead>
    <tbody>${topicRows(topics)}</tbody>
  </table>`;
}

function subjectMeta(s) {
  return `<div class="meta">
    <div><span>Soru</span><b>${s.note.replace(" soru", "")}</b></div>
    <div><span>Konu</span><b>${s.topics.length}</b></div>
    <div><span>Kaynak sütunu</span><b>4</b></div>
  </div>`;
}

function subjectPage(s, no, section, label, rh = 7.5) {
  return `<article class="page">
    ${head(section, label)}
    <div class="subject-head">
      <div>
        <p class="eyebrow">${section} · ${label}</p>
        <h1>${esc(s.name)}</h1>
      </div>
      ${subjectMeta(s)}
    </div>
    <p class="desc">${esc(s.desc)}</p>
    <div class="table-note"><span>Sütun başlarına kaynağın adını yaz.</span><span>Konuyu bitirince o sütundaki kutuya <b>✓</b> koy.</span></div>
    ${table(s.topics, rh)}
    <div class="table-foot">
      <span>Biten konu: <b>_____ / ${s.topics.length}</b></span>
      <span>Tekrarı yapılan: <b>_____</b></span>
      <span>Not: <i class="notline"></i></span>
    </div>
    ${foot(no, label)}
  </article>`;
}

function pairPage(a, b, no, section, label, rhA = 8.5, rhB = 8.5) {
  const block = (s, rh) => `<section class="subject-block">
    <div class="subject-head small">
      <div><p class="eyebrow">${section}</p><h2>${esc(s.name)}</h2></div>
      ${subjectMeta(s)}
    </div>
    <p class="desc small">${esc(s.desc)}</p>
    ${table(s.topics, rh)}
  </section>`;

  return `<article class="page">
    ${head(section, label)}
    <div class="pair-wrap">
      ${block(a, rhA)}
      ${block(b, rhB)}
    </div>
    <div class="table-foot">
      <span>${a.name} biten: <b>____ / ${a.topics.length}</b></span>
      <span>${b.name} biten: <b>____ / ${b.topics.length}</b></span>
      <span>Not: <i class="notline"></i></span>
    </div>
    ${foot(no, label)}
  </article>`;
}

/* ------------------------------------------------------------------ cover */
const cover = `<article class="page cover">
  <div class="cover-top">
    <div class="brand big"><img src="data:image/png;base64,${logo}" alt=""><div><b>ROTA</b><span>Ders ve deneme takip sistemi</span></div></div>
    <span class="cover-badge">YKS 2027</span>
  </div>

  <div class="cover-main">
    <p class="eyebrow">SAYISAL · SAY · KONU TAKİP DEFTERİ</p>
    <h1>Konumetre<span>2027</span></h1>
    <p class="lead">Her dersin konuları alt alta, sağında dört kaynak sütunu.<br>Kaynağı yaz, konu bitince işaretle. Nerede kaldığını tek bakışta gör.</p>

    <div class="cover-cards">
      <div>
        <span>Öğrenci</span>
        <b class="write"><i>ad soyad</i></b>
        <b class="write sub"><i>alan · sınıf</i></b>
      </div>
      <div>
        <span>Başlangıç</span>
        <b class="write"><i>gün / ay / yıl</i></b>
        <b class="write sub"><i>kalan hafta</i></b>
      </div>
      <div>
        <span>Günlük hedef</span>
        <b class="write"><i>soru</i></b>
        <b class="write sub"><i>dakika</i></b>
      </div>
      <div>
        <span>Haftalık hedef</span>
        <b class="write"><i>soru</i></b>
        <b class="write sub"><i>dakika</i></b>
      </div>
    </div>

    <div class="cover-counts">
      <div><b>120</b><span>TYT konusu</span></div>
      <div><b>76</b><span>AYT konusu</span></div>
      <div><b>196</b><span>toplam konu</span></div>
      <div><b>4</b><span>kaynak sütunu</span></div>
    </div>

    <div class="sample">
      <p class="sample-title">Defter böyle görünür</p>
      <table class="demo">
        <thead><tr><th>Konu</th><th>Kaynak 1</th><th>Kaynak 2</th><th>Kaynak 3</th><th>Kaynak 4</th></tr></thead>
        <tbody>
          <tr><td>Fonksiyonlar</td><td><i class="tick on"></i></td><td><i class="tick on"></i></td><td><i class="tick"></i></td><td><i class="tick"></i></td></tr>
          <tr><td>Polinomlar</td><td><i class="tick on"></i></td><td><i class="tick"></i></td><td><i class="tick"></i></td><td><i class="tick"></i></td></tr>
          <tr><td>Trigonometri</td><td><i class="tick on"></i></td><td><i class="tick on"></i></td><td><i class="tick on"></i></td><td><i class="tick"></i></td></tr>
        </tbody>
      </table>
      <p class="sample-note">Sütun başına kaynağı yaz (3D, Bilgi Sarmal, Palme...). O kaynaktan konu bitince kutuya ✓ koy.</p>
    </div>

    <div class="cover-facts">
      <div><span>TYT</span><b>120 soru · 165 dk</b></div>
      <div><span>AYT · SAY</span><b>80 soru · 180 dk</b></div>
      <div><span>SAY puanı</span><b>TYT %40 + AYT %60</b></div>
      <div><span>Net</span><b>D − Y / 4</b></div>
    </div>
  </div>

  <div class="cover-bottom">
    <p><b>2027 notu:</b> Sınav yapısı 2026 ile aynı; 2027 adayı mevcut lise müfredatından sorumlu. Resmî takvim henüz açıklanmadı (Ekim 2026).</p>
    <p class="fine">Gri Koç konumetre mantığından uyarlanmış bağımsız bir çalışma defteridir. Gri Koç, Tonguç veya ÖSYM ile resmî bağlantısı yoktur.</p>
  </div>
</article>`;

/* ------------------------------------------------------------------- html */
const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>YKS 2027 · Konumetre (SAY)</title>
<style>
  @page { size:A4; margin:0; }
  :root {
    --ink:#1d2721; --muted:#67736d; --muted2:#8d9993;
    --line:#dfe4dd; --line2:#ccd5cc;
    --accent:#4f7d16; --accent-dark:#365a0e; --teal:#0e7c8c;
    --tint:#f4f8ed; --tint2:#f7faf7; --paper:#ffffff;
  }
  * { box-sizing:border-box; }
  html, body { margin:0; padding:0; background:#e9ede7; }
  body { font-family:"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color:var(--ink); font-size:9pt; line-height:1.45; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  h1,h2,h3,p,ul { margin:0; }
  b, strong { font-weight:650; }
  .page { position:relative; width:210mm; height:297mm; padding:14mm 14mm 16mm; background:var(--paper); overflow:hidden; page-break-after:always; break-after:page; }
  .page:last-child { page-break-after:auto; break-after:auto; }

  .head { display:flex; align-items:center; justify-content:space-between; gap:8mm; padding-bottom:3.2mm; border-bottom:1px solid var(--line); }
  .brand { display:flex; align-items:center; gap:2.8mm; }
  .brand img { width:8.6mm; height:8.6mm; border-radius:2.2mm; object-fit:cover; }
  .brand div { display:flex; flex-direction:column; line-height:1.15; }
  .brand b { font-size:10pt; font-weight:750; letter-spacing:-.02em; color:var(--accent-dark); }
  .brand span { font-size:6.6pt; color:var(--muted2); }
  .brand.big img { width:11mm; height:11mm; border-radius:2.8mm; }
  .brand.big b { font-size:14pt; }
  .brand.big span { font-size:7pt; }
  .head-right { display:flex; align-items:center; gap:3mm; font-size:6.6pt; color:var(--muted2); }
  .head-right span { letter-spacing:.12em; text-transform:uppercase; }
  .head-right b { color:var(--ink); font-weight:600; padding-left:3mm; border-left:1px solid var(--line); }

  .subject-head { display:flex; align-items:flex-end; justify-content:space-between; gap:8mm; margin:8mm 0 2.6mm; }
  .eyebrow { color:var(--accent); font-size:6.6pt; font-weight:700; letter-spacing:.16em; text-transform:uppercase; margin-bottom:1.4mm; }
  h1 { font-size:31pt; line-height:1; font-weight:750; letter-spacing:-.045em; }
  h2 { font-size:18pt; line-height:1.05; font-weight:730; letter-spacing:-.035em; }
  .subject-head.small { margin:0 0 1.8mm; }
  .subject-head.small h2 { font-size:16pt; }
  .meta { display:flex; gap:7mm; padding-bottom:1.2mm; }
  .meta div { text-align:right; }
  .meta span { display:block; color:var(--muted2); font-size:5.8pt; letter-spacing:.08em; text-transform:uppercase; }
  .meta b { font-size:12pt; font-weight:700; letter-spacing:-.03em; }
  .desc { color:var(--muted); font-size:8pt; max-width:170mm; margin-bottom:4mm; }
  .desc.small { font-size:7pt; margin-bottom:2.4mm; }
  .table-note { display:flex; justify-content:space-between; gap:5mm; margin-bottom:1.8mm; color:var(--muted2); font-size:6.4pt; }
  .table-note b { color:var(--accent); }

  /* main table */
  table.konu { width:100%; border-collapse:collapse; table-layout:fixed; }
  .konu thead th { border:1px solid var(--line2); background:var(--tint); height:14mm; padding:1.6mm; vertical-align:top; text-align:left; font-weight:600; color:var(--muted); }
  .konu thead th.num { width:8mm; background:var(--tint2); vertical-align:bottom; font-size:6pt; letter-spacing:.06em; text-align:center; }
  .konu thead th.topic { background:var(--tint); vertical-align:bottom; font-size:6.4pt; letter-spacing:.1em; text-transform:uppercase; }
  .konu thead th.res { position:relative; width:22mm; }
  .konu thead th.res .rn { position:absolute; top:1.4mm; left:1.8mm; font-size:5.8pt; color:#b3bcb6; font-weight:600; }
  .konu thead th.res .wline { position:absolute; left:1.8mm; right:1.8mm; bottom:2.4mm; border-bottom:1px solid #b9c4ba; }
  .konu tbody td { border:1px solid var(--line); height:var(--rh,7.5mm); padding:0 2.2mm; font-size:8.9pt; }
  .konu tbody td.num { text-align:center; color:var(--muted2); font-size:6.4pt; font-variant-numeric:tabular-nums; background:#fcfdfb; }
  .konu tbody td.topic { color:var(--ink); font-weight:480; }
  .konu tbody td.cell { text-align:center; padding:0; }
  .konu tbody tr:nth-child(even) td { background:#fbfcfa; }
  .konu tbody tr:nth-child(even) td.num { background:#f7f9f5; }
  .tick { display:inline-block; width:4.1mm; height:4.1mm; border:1px solid #d6ddd4; border-radius:.6mm; background:#fff; vertical-align:middle; }
  .tick.on { border-color:#b9d294; background:#edf5e1; position:relative; }
  .tick.on::after { content:""; position:absolute; left:1mm; top:.45mm; width:1.1mm; height:1.9mm; border-right:1.4px solid var(--accent); border-bottom:1.4px solid var(--accent); transform:rotate(40deg); }

  .konu.large tbody td { font-size:10.3pt; }
  .konu.large tbody td.num { font-size:7pt; }
  .konu.large .tick { width:5mm; height:5mm; }
  .konu.large thead th { height:15mm; }
  .konu.large thead th.topic { font-size:7pt; }
  .konu.large thead th.res .rn { font-size:6.4pt; }
  .konu.large thead th.res .wline { bottom:3mm; }
  .pair-wrap .konu tbody td { font-size:8.6pt; }
  .pair-wrap .konu.large tbody td { font-size:9.6pt; }
  .pair-wrap .konu thead th { height:11mm; }
  .pair-wrap .konu thead th.res { width:20mm; }

  .table-foot { display:flex; align-items:center; gap:9mm; margin-top:3.4mm; padding-top:2.2mm; border-top:1px solid var(--line); color:var(--muted); font-size:6.8pt; }
  .table-foot b { color:var(--ink); font-weight:650; }
  .table-foot span:last-child { margin-left:auto; display:flex; align-items:center; gap:2mm; }
  .notline { display:inline-block; width:42mm; border-bottom:1px solid var(--line2); height:3mm; }

  .pair-wrap { display:flex; flex-direction:column; gap:7mm; margin-top:2mm; }
  .pair-wrap .subject-block:last-child { border-top:1px dashed var(--line2); padding-top:5.5mm; }

  .foot { position:absolute; left:14mm; right:14mm; bottom:7mm; display:flex; justify-content:space-between; align-items:center; gap:6mm; padding-top:2.2mm; border-top:1px solid var(--line); color:var(--muted2); font-size:5.8pt; letter-spacing:.02em; }
  .foot .pno { color:var(--accent); font-weight:700; font-variant-numeric:tabular-nums; }

  /* cover */
  .cover { display:flex; flex-direction:column; padding:15mm 15mm 14mm; background:linear-gradient(180deg,#fff 0%,#fbfdf8 62%,#f4f8ed 100%); }
  .cover::before { content:""; position:absolute; right:-45mm; top:-55mm; width:150mm; height:150mm; border-radius:50%; background:radial-gradient(circle,rgba(141,198,63,.16),rgba(141,198,63,0) 66%); }
  .cover::after { content:""; position:absolute; left:-60mm; bottom:-70mm; width:160mm; height:160mm; border-radius:50%; background:radial-gradient(circle,rgba(19,155,178,.10),rgba(19,155,178,0) 66%); }
  .cover > * { position:relative; z-index:1; }
  .cover-top { display:flex; justify-content:space-between; align-items:flex-start; }
  .cover-badge { font-size:6.8pt; font-weight:650; letter-spacing:.12em; color:var(--accent-dark); border:1px solid #cbdcb2; background:#f1f7e7; padding:1.4mm 3mm; border-radius:99px; }
  .cover-main { flex:1; display:flex; flex-direction:column; justify-content:center; padding:8mm 0; }
  .cover h1 { font-size:58pt; line-height:.92; letter-spacing:-.055em; color:var(--accent-dark); margin:2.5mm 0 5mm; }
  .cover h1 span { display:block; font-size:25pt; letter-spacing:.08em; color:#a9b5ac; font-weight:600; margin-top:3mm; }
  .lead { font-size:11pt; line-height:1.6; color:var(--muted); }
  .cover-cards { display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:24mm; gap:3mm; width:158mm; margin-top:12mm; }
  .cover-cards div { display:flex; flex-direction:column; padding:3.4mm 4mm; border:1px solid var(--line); border-radius:2.6mm; background:rgba(255,255,255,.7); }
  .cover-cards span { display:block; color:var(--muted2); font-size:6pt; letter-spacing:.12em; text-transform:uppercase; font-weight:650; }
  .cover-cards b { display:block; font-size:14pt; font-weight:720; letter-spacing:-.03em; margin-top:1mm; }
  .cover-cards small { display:block; color:var(--muted); font-size:6.6pt; margin-top:.4mm; }
  .cover-cards b.write { display:flex; align-items:flex-end; justify-content:flex-end; height:7mm; margin:0; border-bottom:1px solid #c3cdc2; }
  .cover-cards b.write.sub { height:6mm; border-bottom:1px dotted #d9dfd7; }
  .cover-cards b.write i { font-style:normal; font-weight:500; font-size:5.4pt; letter-spacing:.03em; color:#b6c0b8; padding-bottom:.7mm; }
  .cover-counts { display:grid; grid-template-columns:repeat(4,1fr); width:158mm; margin-top:6mm; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
  .cover-counts div { padding:3mm 3mm 3mm 0; }
  .cover-counts div + div { padding-left:3.4mm; border-left:1px solid var(--line); }
  .cover-counts b { display:block; font-size:15pt; color:var(--accent); font-weight:730; letter-spacing:-.04em; }
  .cover-counts span { display:block; color:var(--muted2); font-size:6.2pt; margin-top:.3mm; }

  .sample { margin-top:8mm; width:158mm; }
  .sample-title { color:var(--muted2); font-size:6.2pt; letter-spacing:.12em; text-transform:uppercase; font-weight:650; margin-bottom:1.6mm; }
  table.demo { width:100%; border-collapse:collapse; table-layout:fixed; }
  .demo th { border:1px solid var(--line2); background:var(--tint); color:var(--muted); font-size:6.4pt; font-weight:600; text-align:left; padding:1.4mm 2mm; height:8mm; }
  .demo td { border:1px solid var(--line); padding:1.2mm 2mm; font-size:7.4pt; color:var(--ink); height:6.6mm; }
  .demo td:not(:first-child) { text-align:center; }
  .sample-note { color:var(--muted2); font-size:6.3pt; margin-top:1.4mm; }
  .cover-bottom { flex:none; border-top:1px solid var(--line); padding-top:3mm; }
  .cover-bottom p { color:var(--muted); font-size:6.6pt; line-height:1.5; }
  .cover-bottom p b { color:var(--ink); }
  .cover-bottom .fine { color:var(--muted2); font-size:5.9pt; margin-top:1.2mm; }
  .cover-facts { display:grid; grid-template-columns:repeat(4,1fr); width:158mm; margin-top:6mm; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
  .cover-facts div { padding:2.4mm 3mm 2.4mm 0; }
  .cover-facts div + div { padding-left:3.2mm; border-left:1px solid var(--line); }
  .cover-facts span { display:block; color:var(--accent); font-size:5.6pt; letter-spacing:.1em; text-transform:uppercase; font-weight:680; }
  .cover-facts b { display:block; font-size:7.8pt; margin-top:.5mm; letter-spacing:-.01em; }

</style>
</head>
<body>
${cover}
${subjectPage(TYT.turkce, 2, "TYT", "Türkçe", 13.1)}
${subjectPage(TYT.matematik, 3, "TYT", "Temel Matematik", 7.7)}
${subjectPage(TYT.geometri, 4, "TYT", "Geometri", 13.5)}
${subjectPage(TYT.fizik, 5, "TYT", "Fizik", 13.5)}
${pairPage(TYT.kimya, TYT.biyoloji, 6, "TYT", "Kimya + Biyoloji", 9, 9)}
${pairPage(TYT.tarih, TYT.cografya, 7, "TYT", "Tarih + Coğrafya", 6.7, 6.7)}
${pairPage(TYT.felsefe, TYT.din, 8, "TYT", "Felsefe + Din", 12.4, 12.4)}
${subjectPage(AYT.matematik, 9, "AYT", "Matematik", 12.2)}
${subjectPage(AYT.geometri, 10, "AYT", "Geometri", 14.6)}
${subjectPage(AYT.fizik, 11, "AYT", "Fizik", 10.1)}
${subjectPage(AYT.kimya, 12, "AYT", "Kimya", 13.6)}
${subjectPage(AYT.biyoloji, 13, "AYT", "Biyoloji", 10.1)}
</body>
</html>`;

writeFileSync(join(here, "konumetre-2027-sayisal.html"), html);
console.log("ok");
console.log("TYT:", Object.values(TYT).reduce((a, s) => a + s.topics.length, 0));
console.log("AYT:", Object.values(AYT).reduce((a, s) => a + s.topics.length, 0));
