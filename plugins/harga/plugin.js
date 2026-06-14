/* ============================================================
   plugins/harga/plugin.js — Plugin Harga Produk + Schema (GitCMS)
   ------------------------------------------------------------
   Konsepnya sama seperti plugin FAQ:
   1. Menambahkan kolom di EDITOR (admin) — di sini kolom "Harga" dan
      status "Tersedia/Habis" — yang muncul HANYA saat plugin aktif.
      (Bagian editor di-handle panel admin: model/index.html +
       model/assets/js/app.js, digerbang pluginActive("harga").)
   2. Menyuntikkan schema.org "Product" (JSON-LD) HANYA pada artikel
      yang punya field `harga` di frontmatter — agar harga, mata uang,
      dan ketersediaan dipahami mesin pencari (rich result / AEO).

   Berbeda dengan FAQ, plugin ini TIDAK merender HTML harga sendiri:
   tampilan harga + tombol pesan sudah menjadi urusan TEMA jualan
   (mis. tema "Kuliner"). Plugin cukup mengurus DATA & schema, sesuai
   kontrak emas "inti/plugin menyediakan data, tema yang merender".

   Data pada frontmatter (ditulis panel admin):
     harga: 25000          → angka bulat (tanpa titik/koma)
     tersedia: false       → opsional; false / "habis" = stok habis
   ============================================================ */

/* Ambil node halaman aktif (artikel ATAU halaman). */
function getNode(ctx) {
  return (ctx && (ctx.post || ctx.page)) || null;
}

/* Ambil hanya digit dari harga ("Rp 25.000" / 25000 / "25,000") → 25000. */
function hargaToNumber(v) {
  if (typeof v === "number" && isFinite(v)) return Math.round(v);
  var digits = String(v == null ? "" : v).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/* true bila stok ditandai habis (tersedia:false atau "habis"). */
function isHabis(meta) {
  if (!meta) return false;
  return meta.tersedia === false || String(meta.tersedia).toLowerCase() === "habis";
}

/* URL gambar absolut yang aman: URL absolut/eksternal dibiarkan apa adanya,
   path lokal/relatif diubah jadi absolut lewat U.abs (untuk schema image). */
function absImg(ctx, url) {
  var u = String(url == null ? "" : url).trim();
  if (!u) return "";
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
  var U = ctx && ctx.U;
  if (U && typeof U.abs === "function") return U.abs(u);
  return u;
}

module.exports = {
  id: "harga",
  name: "Harga Produk + Schema",
  description:
    "Menambahkan kolom Harga & status Tersedia/Habis pada editor artikel. Harga dipakai tema jualan/kuliner untuk menampilkan produk & tombol pesan, sekaligus menyuntikkan schema Product (JSON-LD) untuk hasil kaya di pencarian.",
  version: "1.0.0",

  hooks: {
    /* ---- Schema Product: hanya bila artikel punya harga > 0 ---- */
    filterSeo: function (seo, ctx) {
      var node = getNode(ctx);
      if (!node || !node.meta) return seo;

      var price = hargaToNumber(node.meta.harga);
      if (!price) return seo; // bukan produk / harga kosong → lewati

      var name = String(node.meta.title || (node.meta && node.meta.name) || "").trim();
      if (!name) return seo;

      var ld = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: name,
        offers: {
          "@type": "Offer",
          price: String(price),
          priceCurrency: "IDR",
          availability: isHabis(node.meta)
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        },
      };

      // Tautan ke halaman produk (pakai canonical absolut bila tersedia).
      if (seo && seo.canonical) ld.offers.url = seo.canonical;

      // Gambar produk (absolut). Pakai featuredImage mentah lalu diabsolutkan
      // dengan penjaga (ogImage inti tidak aman untuk URL eksternal).
      var img = absImg(ctx, node.featuredImage || (node.meta && node.meta.featured_image) || "");
      if (img) ld.image = img;

      // Deskripsi singkat (excerpt) bila ada.
      var desc = String(node.excerpt || (node.meta && node.meta.excerpt) || "").trim();
      if (desc) ld.description = desc;

      seo.jsonLd = (seo.jsonLd || []).concat([ld]);
      return seo;
    },
  },
};
