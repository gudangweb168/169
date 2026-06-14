/* ============================================================
   templates/not-found.js — Halaman 404 (TEMA)
   ctx: { config, U, lib, site, seo, themeVars }
   ============================================================ */

var layout = require("./partials/layout");

module.exports = function notFound(ctx) {
  var U = ctx.U, lib = ctx.lib;
  var attr = lib.attr;

  var content =
    '\n    <section class="error-page"><div class="container">' +
    "<h1>404</h1>" +
    "<p>Maaf, halaman yang Anda cari tidak ditemukan.</p>" +
    '<a href="' + attr(U.url("/")) + '" class="btn btn-primary btn-lg">← Kembali ke Beranda</a>' +
    "</div></section>";

  return layout(ctx, content);
};
