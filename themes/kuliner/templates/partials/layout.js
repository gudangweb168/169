/* ============================================================
   partials/layout.js — Kerangka halaman (TEMA Kuliner)
   Menyatukan head + header + main + footer + keranjang + skrip.
   Dipanggil oleh setiap template: layout(ctx, contentHtml).

   PENTING (jebakan containing-block): drawer keranjang, scrim, dan
   tombol mengambang (FAB) dirender sebagai ANAK LANGSUNG <body>,
   bukan di dalam header/main. Dengan begitu position:fixed mereka
   tidak "terperangkap" oleh ancestor ber-transform/filter.
   ============================================================ */

var head = require("./head");
var header = require("./header");
var footer = require("./footer");
var icons = require("./icons");
var restoMod = require("./resto");

// Konfigurasi yang dibutuhkan JS sisi-klien (keranjang & order WhatsApp).
// Ditulis sebagai window.__KULINER__ agar script.js (aset statis yang sama
// untuk semua build) bisa membacanya per-situs. Aman dari pemutus </script>.
function clientConfig(ctx) {
  var resto = restoMod.getResto(ctx);
  var cfg = {
    wa: resto.order.whatsapp,
    store: resto.order.storeName,
    greeting: resto.order.greeting,
    currency: resto.order.currency,
    note: resto.order.note,
    basePath: ctx.U.basePath || "",
  };
  var json = JSON.stringify(cfg).replace(/</g, "\\u003c");
  return '\n  <script>window.__KULINER__ = ' + json + ";</script>";
}

// Drawer keranjang + scrim + tombol mengambang.
function cartUI(ctx) {
  var resto = restoMod.getResto(ctx);
  var noteHtml = resto.order.note
    ? '<p class="cart-note">' + ctx.lib.esc(resto.order.note) + "</p>"
    : "";

  return (
    '\n  <button type="button" class="cart-fab" id="cart-fab" hidden aria-label="Lihat keranjang">' +
    icons.ui("cart") +
    '<span class="cart-fab-info"><span class="cart-fab-count" data-cart-count>0</span> item</span>' +
    '<span class="cart-fab-total" data-cart-total>—</span>' +
    "</button>" +

    '\n  <div class="cart-scrim" id="cart-scrim" hidden></div>' +

    '\n  <aside class="cart-drawer" id="cart-drawer" aria-hidden="true" aria-label="Keranjang belanja">' +
    '\n    <div class="cart-head">' +
    '<h2 class="cart-title">' + icons.ui("bag") + " Keranjang</h2>" +
    '<button type="button" class="cart-close" id="cart-close" aria-label="Tutup keranjang">' + icons.ui("close") + "</button>" +
    "</div>" +
    '\n    <div class="cart-meja" data-cart-meja hidden>' +
    icons.ui("table") +
    '<span>Pesanan untuk <strong data-cart-meja-text></strong></span>' +
    '<button type="button" class="cart-meja-clear" data-cart-meja-clear>ubah</button>' +
    "</div>" +
    '\n    <div class="cart-body">' +
    '<div class="cart-items" id="cart-items"></div>' +
    '<div class="cart-empty" id="cart-empty">' +
    '<span class="cart-empty-ic" aria-hidden="true">' + icons.ui("bag") + "</span>" +
    "<p>Keranjang masih kosong.</p><span>Yuk pilih menu favoritmu dan ketuk tombol +.</span>" +
    "</div>" +
    "</div>" +
    '\n    <div class="cart-foot">' +
    '<div class="cart-total-row"><span>Total</span><strong data-cart-total>—</strong></div>' +
    '<button type="button" class="cart-checkout" id="cart-checkout">' + icons.ui("whatsapp") + " Pesan via WhatsApp</button>" +
    noteHtml +
    "</div>" +
    "\n  </aside>"
  );
}

module.exports = function layout(ctx, content) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib;
  var attr = lib.attr;

  // HTML tambahan dari plugin sebelum </body> (mis. overlay WhatsApp).
  var pluginBody = (ctx.plugins && ctx.plugins.bodyEnd) ? ctx.plugins.bodyEnd(ctx) : "";

  return '<!DOCTYPE html>\n<html lang="' + attr(config.language || "id") + '">\n' +
    head(ctx) +
    "\n<body>\n" +
    header(ctx) +
    '\n  <main class="site-main">\n' +
    content +
    "\n  </main>\n" +
    footer(ctx) +
    cartUI(ctx) +
    clientConfig(ctx) +
    '\n  <script src="' + attr(U.url("/theme/script.js")) + '" defer></script>' +
    pluginBody +
    "\n</body>\n</html>";
};
