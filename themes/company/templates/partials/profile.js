/* ============================================================
   partials/profile.js — Penyusun data "company profile" (TEMA)
   Membaca config.profile (opsional) dan mengembalikan objek yang
   sudah dinormalkan + diberi nilai fallback dari config dasar,
   sehingga beranda tetap rapi walau profile tidak diisi.

   Catatan kontrak: ini HANYA membaca data dari ctx (config/U).
   Tidak ada akses filesystem / API — itu urusan inti.
   ============================================================ */

// Tautan aman untuk URL internal (diawali basePath) maupun eksternal.
function navHref(U, url) {
  var u = String(url || "");
  if (!u) return "#";
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
  return U.url(u);
}

function obj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function arr(v) {
  return Array.isArray(v) ? v : [];
}

function getProfile(ctx) {
  var config = ctx.config || {};
  var p = obj(config.profile);
  var social = obj(config.social);

  var defaultPrimaryUrl = social.email ? "mailto:" + social.email : "/about/";

  var pc = obj(p.primaryCta);
  var sc = obj(p.secondaryCta);
  var hc = obj(p.headerCta);
  var about = obj(p.about);
  var band = obj(p.ctaBand);
  var bandBtn = obj(band.button);
  var faq = obj(p.faq);

  var stats = arr(p.stats).filter(function (s) { return s && (s.value || s.label); });
  // Layanan: simpan juga `url` agar tiap kartu bisa diarahkan ke halaman detail.
  var services = arr(p.services)
    .filter(function (s) { return s && (s.title || s.text); })
    .map(function (s) {
      return { icon: s.icon || "", title: s.title || "", text: s.text || "", url: s.url || "" };
    });
  var aboutPoints = arr(about.points).filter(Boolean);

  // FAQ: tiap item butuh pertanyaan (q) — jawaban (a) opsional.
  var faqItems = arr(faq.items)
    .map(function (f) {
      f = obj(f);
      return { q: (f.q || f.question || "").trim(), a: (f.a || f.answer || "").trim() };
    })
    .filter(function (f) { return f.q; });
  // Toggle: sama seperti seksi lain, FAQ bisa dimunculkan / disembunyikan.
  var faqEnabled = faq.enabled !== false; // default tampil bila ada isinya

  var hasAbout = !!(about.text || aboutPoints.length);
  var hasBand = !!(band.title || band.text);
  var hasSecondary = !!(sc.text || sc.url);
  // Tombol CTA header: terpisah & bisa diatur; jika kosong, ikut primaryCta.
  var headerCtaShow = hc.show !== false && hc.enabled !== false;

  return {
    eyebrow: p.eyebrow || "Selamat Datang",
    headline: p.headline || config.title || "",
    subheadline: p.subheadline || config.description || config.tagline || "",
    heroImage: p.heroImage || "",
    heroBackground: p.heroBackground || "",

    primaryCta: {
      text: pc.text || "Hubungi Kami",
      url: pc.url || defaultPrimaryUrl,
    },
    secondaryCta: hasSecondary ? { text: sc.text || "Selengkapnya", url: sc.url || "#" } : null,

    // Tombol CTA pada header (dapat diubah & disembunyikan terpisah dari hero).
    headerCta: {
      show: headerCtaShow,
      text: hc.text || pc.text || "Hubungi Kami",
      url: hc.url || pc.url || defaultPrimaryUrl,
    },

    stats: stats,
    hasStats: stats.length >= 2,

    servicesTitle: p.servicesTitle || "Layanan Kami",
    servicesEyebrow: p.servicesEyebrow || "Apa yang kami lakukan",
    servicesIntro: p.servicesIntro || "",
    services: services,
    hasServices: services.length > 0,

    // FAQ beranda — fleksibel seperti seksi lainnya (punya toggle + isi).
    faq: faqEnabled && faqItems.length
      ? {
          eyebrow: faq.eyebrow || "FAQ",
          title: faq.title || "Pertanyaan yang Sering Diajukan",
          intro: faq.intro || "",
          items: faqItems,
        }
      : null,

    about: hasAbout
      ? {
          eyebrow: about.eyebrow || "Tentang Kami",
          title: about.title || "Mitra tepercaya untuk pertumbuhan Anda",
          text: about.text || "",
          image: about.image || "",
          points: aboutPoints,
        }
      : null,

    ctaBand: hasBand
      ? {
          title: band.title || "",
          text: band.text || "",
          button: { text: bandBtn.text || "Hubungi Kami", url: bandBtn.url || defaultPrimaryUrl },
        }
      : null,
  };
}

module.exports = { getProfile, navHref };
