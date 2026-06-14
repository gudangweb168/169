/* ============================================================
   templates/not-found.js — Halaman 404 (TEMA Kuliner)
   ctx: { config, U, lib, site, seo, themeVars }
   ============================================================ */

var layout = require("./partials/layout");
var icons = require("./partials/icons");

module.exports = function notFound(ctx) {
  var U = ctx.U, lib = ctx.lib;
  var attr = lib.attr;

  var content =
    '\n    <section class="error-page container">' +
    '\n      <span class="error-ic" aria-hidden="true">' + icons.ui("bag") + "</span>" +
    "\n      <h1>404</h1>" +
    "\n      <p>Menu yang kamu cari sepertinya sudah habis atau dipindahkan.</p>" +
    '\n      <a href="' + attr(U.url("/")) + '" class="btn btn-primary btn-lg">← Kembali ke Beranda</a>' +
    "\n    </section>";

  return layout(ctx, content);
};
