/* ============================================================
   plugins/faq/plugin.js — Plugin FAQ + Schema (untuk GitCMS)
   ------------------------------------------------------------
   Saat AKTIF, plugin ini:
   1. Menampilkan blok FAQ (akordeon) di bawah isi artikel/halaman
      yang memiliki data `faq` pada frontmatter-nya.
   2. Menyuntikkan schema.org "FAQPage" (JSON-LD) HANYA bila jumlah
      pertanyaan 3 atau lebih — sesuai rekomendasi mesin pencari.

   Catatan SEO/AEO: Google mensyaratkan isi FAQ benar-benar TAMPIL di
   halaman agar rich result/“People also ask” valid. Karena itu blok
   FAQ selalu dirender visual; schema baru menyusul saat ≥ 3 item.

   Data FAQ pada frontmatter (ditulis oleh panel admin) berbentuk:
     faq: [{"q":"Pertanyaan?","a":"Jawaban."}, ...]
   gray-matter membacanya sebagai array objek { q, a }.

   Plugin membawa gaya (CSS) sendiri lewat hook `headExtra`, sehingga
   bekerja di tema mana pun tanpa perlu menyentuh berkas tema.
   ============================================================ */

/* Ambil daftar FAQ dari konteks halaman aktif (artikel ATAU halaman). */
function getFaq(ctx) {
  const node = (ctx && (ctx.post || ctx.page)) || null;
  if (!node || !node.meta) return [];
  const raw = node.meta.faq;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const q = String(it.q != null ? it.q : it.question || "").trim();
      const a = String(it.a != null ? it.a : it.answer || "").trim();
      if (!q || !a) return null;
      return { q, a };
    })
    .filter(Boolean);
}

/* Label sesuai bahasa situs (default Indonesia). */
function isEnglish(ctx) {
  return !!(ctx && ctx.config && /^en/i.test(ctx.config.language || ""));
}

/* Escape teks (pakai helper inti bila ada, jika tidak pakai bawaan). */
function escFn(ctx) {
  if (ctx && ctx.lib && typeof ctx.lib.esc === "function") return ctx.lib.esc;
  return function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };
}

module.exports = {
  id: "faq",
  name: "FAQ + Schema",
  description:
    "Menambahkan kolom FAQ pada editor. Menampilkan akordeon FAQ di artikel/halaman dan menyuntikkan schema FAQPage otomatis saat ada 3 pertanyaan atau lebih.",
  version: "1.0.0",

  hooks: {
    /* ---- Schema FAQPage: hanya bila ≥ 3 pertanyaan ---- */
    filterSeo: function (seo, ctx) {
      const items = getFaq(ctx);
      if (items.length < 3) return seo;

      const ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map(function (f) {
          return {
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a.replace(/\s+/g, " ").trim(),
            },
          };
        }),
      };

      seo.jsonLd = (seo.jsonLd || []).concat([ld]);
      return seo;
    },

    /* ---- Gaya FAQ (disuntik sekali, hanya saat halaman memuat FAQ) ---- */
    headExtra: function (ctx) {
      if (!getFaq(ctx).length) return "";
      return (
        '\n  <style id="gc-faq-style">' +
        ".gc-faq{margin:40px 0 8px;}" +
        ".gc-faq__title{font-family:var(--font-display,inherit);font-size:1.45rem;line-height:1.2;margin:0 0 18px;color:var(--ink,#15171c);}" +
        ".gc-faq__list{display:flex;flex-direction:column;gap:10px;}" +
        ".gc-faq__item{border:1px solid var(--line,#e8e9ed);border-radius:var(--radius,12px);background:var(--surface,#fff);overflow:hidden;transition:border-color .18s ease,box-shadow .18s ease;}" +
        ".gc-faq__item[open]{border-color:var(--accent,#2d54c8);box-shadow:var(--shadow-sm,0 1px 2px rgba(16,18,24,.05));}" +
        ".gc-faq__q{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;font-weight:600;color:var(--ink,#15171c);font-size:1.02rem;}" +
        ".gc-faq__q::-webkit-details-marker{display:none;}" +
        ".gc-faq__ic{flex:none;width:18px;height:18px;position:relative;transition:transform .2s ease;}" +
        ".gc-faq__ic::before,.gc-faq__ic::after{content:'';position:absolute;background:var(--accent,#2d54c8);border-radius:2px;}" +
        ".gc-faq__ic::before{top:8px;left:0;width:18px;height:2px;}" +
        ".gc-faq__ic::after{top:0;left:8px;width:2px;height:18px;transition:transform .2s ease;}" +
        ".gc-faq__item[open] .gc-faq__ic::after{transform:rotate(90deg);}" +
        ".gc-faq__a{padding:0 18px 16px;color:var(--ink-soft,#41454e);line-height:1.7;}" +
        ".gc-faq__a p{margin:0 0 10px;}.gc-faq__a p:last-child{margin-bottom:0;}" +
        "</style>"
      );
    },

    /* ---- Blok FAQ visual setelah isi artikel/halaman ---- */
    contentAfter: function (ctx) {
      const items = getFaq(ctx);
      if (!items.length) return "";
      const esc = escFn(ctx);
      const heading = isEnglish(ctx)
        ? "Frequently Asked Questions"
        : "Pertanyaan yang Sering Diajukan";

      const rows = items
        .map(function (f, i) {
          // Jawaban: dukung paragraf (pisah baris kosong), tetap di-escape.
          const answer = f.a
            .split(/\n{2,}/)
            .map(function (par) {
              return "<p>" + esc(par).replace(/\n/g, "<br>") + "</p>";
            })
            .join("");
          return (
            '<details class="gc-faq__item"' +
            (i === 0 ? " open" : "") +
            ">" +
            '<summary class="gc-faq__q">' +
            "<span>" + esc(f.q) + "</span>" +
            '<span class="gc-faq__ic" aria-hidden="true"></span>' +
            "</summary>" +
            '<div class="gc-faq__a">' + answer + "</div>" +
            "</details>"
          );
        })
        .join("");

      return (
        '\n        <section class="gc-faq" aria-label="' + esc(heading) + '">' +
        '<h2 class="gc-faq__title">' + esc(heading) + "</h2>" +
        '<div class="gc-faq__list">' + rows + "</div>" +
        "</section>"
      );
    },
  },
};
