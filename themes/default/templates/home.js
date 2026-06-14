/* ============================================================
   templates/home.js — Beranda + paginasi (TEMA)
   Menerima ctx (lihat KONTRAK DATA di README/THEME-ROADMAP):
     { config, U, lib, site, seo, themeVars, posts, pageNum, totalPages }
   ============================================================ */

const layout = require("./partials/layout");
const postCard = require("./partials/post-card");

module.exports = function home(ctx) {
  const { config, U, lib, posts, pageNum, totalPages } = ctx;
  const { esc, attr } = lib;
  const isFirst = pageNum === 1;

  const hero = isFirst
    ? `
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">${esc(config.title)}</h1>
        <p class="hero-tagline">${esc(config.tagline || "")}</p>
      </div>
    </section>`
    : `<section class="page-head"><div class="container"><h1>Artikel — Halaman ${pageNum}</h1></div></section>`;

  const cards = posts.map((p) => postCard(p, ctx)).join("");

  let pagination = "";
  if (totalPages > 1) {
    const prev = pageNum > 1
      ? `<a class="page-link" href="${attr(U.url(pageNum === 2 ? "/" : "/page/" + (pageNum - 1) + "/"))}">← Sebelumnya</a>`
      : `<span class="page-link disabled">← Sebelumnya</span>`;
    const next = pageNum < totalPages
      ? `<a class="page-link" href="${attr(U.url("/page/" + (pageNum + 1) + "/"))}">Berikutnya →</a>`
      : `<span class="page-link disabled">Berikutnya →</span>`;
    pagination = `
      <nav class="pagination">
        ${prev}
        <span class="page-info">Halaman ${pageNum} dari ${totalPages}</span>
        ${next}
      </nav>`;
  }

  const content = `${hero}
    <section class="container post-grid-wrap">
      <div class="post-grid">${cards}</div>
      ${pagination}
    </section>`;

  return layout(ctx, content);
};
