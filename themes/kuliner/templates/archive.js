/* ============================================================
   templates/archive.js — Arsip kategori / tag (TEMA Kuliner)
   Menampilkan produk sebagai grid yang dapat dicari (reuse
   #menu-cari & #menu-grid → script.js memfilternya).
   ctx: { config, U, lib, site, seo, themeVars, kind, term, posts, description }
   ============================================================ */

var layout = require("./partials/layout");
var productCard = require("./partials/product-card");
var icons = require("./partials/icons");

module.exports = function archive(ctx) {
  var lib = ctx.lib, kind = ctx.kind, term = ctx.term, posts = ctx.posts, description = ctx.description;
  var esc = lib.esc, attr = lib.attr;

  var label = kind === "category" ? "Kategori" : "Tag";
  var cards = (posts || []).map(function (p) { return productCard(p, ctx); }).join("");
  var hasDesc = description && String(description).trim();
  var intro = hasDesc ? "<p>" + esc(description) + "</p>" : "<p>" + (posts ? posts.length : 0) + " menu</p>";

  var cari =
    '\n      <div class="cari-box cari-box-arsip">' +
    '<span class="cari-ic" aria-hidden="true">' + icons.ui("search") + "</span>" +
    '<input type="search" id="menu-cari" class="cari-input" placeholder="Cari di ' + attr(label.toLowerCase()) + " " + attr(term) + '…" autocomplete="off" aria-label="Cari menu">' +
    '<button type="button" class="cari-clear" id="menu-cari-clear" hidden aria-label="Hapus pencarian">' + icons.ui("close") + "</button>" +
    "</div>";

  var content =
    '\n    <section class="page-head">' +
    '\n      <div class="container">' +
    '\n        <span class="page-head-kicker">' + label + "</span>" +
    "\n        <h1>" + esc(term) + "</h1>" +
    "\n        " + intro +
    "\n      </div>" +
    "\n    </section>" +
    '\n    <section class="menu">' +
    '\n      <div class="container">' +
    "\n        " + cari +
    '\n        <div class="menu-grid" id="menu-grid" data-menu>' + cards + "</div>" +
    '\n        <div class="menu-empty" id="menu-empty" hidden>' +
    '<span class="menu-empty-ic" aria-hidden="true">' + icons.ui("search") + "</span>" +
    "<p>Menu tidak ditemukan.</p><span>Coba kata kunci lain.</span></div>" +
    "\n      </div>" +
    "\n    </section>";

  return layout(ctx, content);
};
