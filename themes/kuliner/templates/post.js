/* ============================================================
   templates/post.js — Halaman produk tunggal (TEMA Kuliner)
   Setiap artikel = satu produk: foto besar, kategori, judul,
   harga, tombol "Tambah ke Keranjang", deskripsi (isi markdown),
   tag, hook plugin (mis. FAQ), dan menu lainnya (related).
   ctx: { config, U, lib, site, seo, themeVars, post, related }
   ============================================================ */

var layout = require("./partials/layout");
var productCard = require("./partials/product-card");
var icons = require("./partials/icons");
var restoMod = require("./partials/resto");

module.exports = function post(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib, post = ctx.post, related = ctx.related;
  var esc = lib.esc, attr = lib.attr, slugify = lib.slugify, formatDate = lib.formatDate;
  var resto = restoMod.getResto(ctx);

  var title = post.meta.title || "";
  var hargaNum = restoMod.hargaToNumber(post.meta.harga);
  var hargaLabel = restoMod.formatHarga(post.meta.harga, resto.order.currency);
  var tersedia = !(post.meta.tersedia === false || String(post.meta.tersedia).toLowerCase() === "habis");
  var imgUrl = post.featuredImage ? restoMod.mediaUrl(U, post.featuredImage) : "";

  var cat = post.meta.category
    ? '<a href="' + attr(U.url("/category/" + slugify(post.meta.category) + "/")) + '" class="produk-detail-cat">' + esc(post.meta.category) + "</a>"
    : "";

  var tags = Array.isArray(post.meta.tags) && post.meta.tags.length
    ? '<div class="post-tags">' + post.meta.tags
        .map(function (t) { return '<a href="' + attr(U.url("/tag/" + slugify(t) + "/")) + '" class="tag">#' + esc(t) + "</a>"; })
        .join("") + "</div>"
    : "";

  var media = imgUrl
    ? '<img src="' + attr(imgUrl) + '" alt="' + attr(title) + '">'
    : '<span class="produk-detail-ph" aria-hidden="true">' + icons.ui("bag") + "</span>";

  var hargaHtml = hargaLabel
    ? '<div class="produk-detail-harga">' + esc(hargaLabel) + "</div>"
    : '<div class="produk-detail-harga produk-detail-harga-kosong">Hubungi kami untuk harga</div>';

  // Blok pemesanan — membawa data-* agar tombol [data-add] dikenali script.js
  // (closest("[data-id]") menemukan pembungkus ini).
  var addBtn = tersedia
    ? '<button type="button" class="btn btn-primary btn-lg produk-detail-add" data-add>' + icons.ui("plus") + " Tambah ke Keranjang</button>"
    : '<button type="button" class="btn btn-lg produk-detail-add is-disabled" disabled>Stok Habis</button>';

  var pesan =
    '<div class="produk-pesan"' +
    ' data-id="' + attr(post.slug) + '"' +
    ' data-nama="' + attr(title) + '"' +
    ' data-harga="' + attr(hargaNum) + '"' +
    ' data-gambar="' + attr(imgUrl) + '">' +
    hargaHtml +
    addBtn +
    "</div>";

  var relatedHtml = related && related.length
    ? '\n    <section class="menu menu-related">' +
      '\n      <div class="container">' +
      '\n        <div class="section-head"><span class="eyebrow">Menu Lainnya</span><h2>Mungkin kamu suka</h2></div>' +
      '\n        <div class="menu-grid">' + related.map(function (p) { return productCard(p, ctx); }).join("") + "</div>" +
      "\n      </div>" +
      "\n    </section>"
    : "";

  var content =
    '\n    <article class="produk-detail">' +
    '\n      <div class="container">' +
    '\n        <div class="produk-detail-grid">' +
    '\n          <div class="produk-detail-media' + (tersedia ? "" : " is-habis") + '">' + media + (tersedia ? "" : '<span class="produk-habis produk-habis-lg">Habis</span>') + "</div>" +
    '\n          <div class="produk-detail-info">' +
    "\n            " + cat +
    '\n            <h1 class="produk-detail-title">' + esc(title) + "</h1>" +
    '\n            <div class="produk-detail-meta">' +
    (post.meta.author ? "<span>oleh " + esc(post.meta.author) + "</span><span class=\"dot\">·</span>" : "") +
    '<time datetime="' + attr(post.meta.date) + '">' + esc(formatDate(post.meta.date, config.language)) + "</time>" +
    "</div>" +
    "\n            " + pesan +
    "\n          </div>" +
    "\n        </div>" +
    '\n        <div class="produk-detail-konten">' +
    '\n          <div class="post-content">\n' + post.html + "\n          </div>" +
    "\n          " + tags +
    "\n          " + ((ctx.plugins && ctx.plugins.contentAfter) ? ctx.plugins.contentAfter(ctx) : "") +
    "\n        </div>" +
    "\n      </div>" +
    "\n    </article>" +
    relatedHtml;

  return layout(ctx, content);
};
