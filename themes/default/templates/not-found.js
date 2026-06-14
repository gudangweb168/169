/* ============================================================
   templates/not-found.js — Halaman 404 (TEMA)
   ctx: { config, U, lib, site, seo, themeVars }
   ============================================================ */

const layout = require("./partials/layout");

module.exports = function notFound(ctx) {
  const { U, lib } = ctx;
  const { attr } = lib;

  const content = `
    <section class="error-page container">
      <h1>404</h1>
      <p>Halaman yang Anda cari tidak ditemukan.</p>
      <a href="${attr(U.url("/"))}" class="btn-home">← Kembali ke Beranda</a>
    </section>`;

  return layout(ctx, content);
};
