/* ============================================================
   partials/product-card.js — Kartu produk / menu (TEMA Kuliner)
   Dipakai di beranda (grid desktop / list mobile), arsip, dan
   blok "menu lainnya". Dipanggil: productCard(post, ctx, opts).

   Kartu membawa atribut data-* agar JS sisi-klien bisa:
     • memfilter berdasarkan kategori (data-kategori),
     • mencari berdasarkan nama (data-nama),
     • memasukkan item ke keranjang (data-id/nama/harga/gambar).
   ============================================================ */

var restoMod = require("./resto");
var icons = require("./icons");

module.exports = function productCard(post, ctx, opts) {
  var U = ctx.U, lib = ctx.lib;
  var esc = lib.esc, attr = lib.attr, slugify = lib.slugify;
  opts = opts || {};

  var resto = restoMod.getResto(ctx);
  var currency = (opts.currency != null) ? opts.currency : resto.order.currency;
  var showPrice = (opts.showPrice != null) ? opts.showPrice : true;

  var title = post.meta.title || "";
  var hargaNum = restoMod.hargaToNumber(post.meta.harga);
  var hargaLabel = showPrice ? restoMod.formatHarga(post.meta.harga, currency) : "";

  // Ketersediaan: tandai "Habis" bila frontmatter tersedia:false.
  var tersedia = !(post.meta.tersedia === false || String(post.meta.tersedia).toLowerCase() === "habis");

  var catSlug = post.meta.category ? slugify(post.meta.category) : "";
  var catLabel = post.meta.category
    ? '<span class="produk-kategori">' + esc(post.meta.category) + "</span>"
    : "";

  // Gambar (atau placeholder bila kosong) — selalu tertaut ke halaman produk.
  var imgUrl = post.featuredImage ? restoMod.mediaUrl(U, post.featuredImage) : "";
  var thumb = imgUrl
    ? '<img src="' + attr(imgUrl) + '" alt="' + attr(title) + '" loading="lazy">'
    : '<span class="produk-thumb-ph" aria-hidden="true">' + icons.ui("bag") + "</span>";

  var soldBadge = !tersedia ? '<span class="produk-habis">Habis</span>' : "";
  var hargaHtml = hargaLabel
    ? '<span class="produk-harga">' + esc(hargaLabel) + "</span>"
    : '<span class="produk-harga produk-harga-kosong">Hubungi kami</span>';

  // Tombol "+" menambah ke keranjang (dinonaktifkan bila habis).
  var addBtn = tersedia
    ? '<button type="button" class="produk-add" data-add aria-label="Tambah ' + attr(title) + ' ke keranjang">' + icons.ui("plus") + "</button>"
    : '<button type="button" class="produk-add is-disabled" disabled aria-label="' + attr(title) + ' habis">' + icons.ui("plus") + "</button>";

  return (
    '\n      <article class="produk-card' + (tersedia ? "" : " is-habis") + '"' +
    ' data-id="' + attr(post.slug) + '"' +
    ' data-nama="' + attr(title) + '"' +
    ' data-harga="' + attr(hargaNum) + '"' +
    ' data-gambar="' + attr(imgUrl) + '"' +
    ' data-kategori="' + attr(catSlug) + '"' +
    ' data-cari="' + attr((title + " " + (post.meta.category || "")).toLowerCase()) + '">' +
    '\n        <a class="produk-thumb" href="' + attr(U.url(post.permalink)) + '">' + thumb + soldBadge + "</a>" +
    '\n        <div class="produk-body">' +
    "\n          " + catLabel +
    '\n          <h3 class="produk-nama"><a href="' + attr(U.url(post.permalink)) + '">' + esc(title) + "</a></h3>" +
    '\n          <p class="produk-desk">' + esc(post.excerpt || "") + "</p>" +
    '\n          <div class="produk-kaki">' +
    "\n            " + hargaHtml +
    "\n            " + addBtn +
    "\n          </div>" +
    "\n        </div>" +
    "\n      </article>"
  );
};
