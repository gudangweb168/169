/* ============================================================
   templates/archive.js — Arsip kategori / tag (TEMA)
   ctx: { config, U, lib, site, seo, themeVars, kind, term, posts, description }
   ============================================================ */

const layout = require("./partials/layout");
const postCard = require("./partials/post-card");

module.exports = function archive(ctx) {
  const { lib, kind, term, posts, description } = ctx;
  const { esc } = lib;

  const label = kind === "category" ? "Kategori" : "Tag";
  const cards = posts.map((p) => postCard(p, ctx)).join("");
  const hasDesc = description && String(description).trim();
  const intro = hasDesc
    ? `<p>${esc(description)}</p>`
    : `<p>${posts.length} artikel</p>`;

  const content = `
    <section class="page-head">
      <div class="container">
        <span class="page-head-kicker">${label}</span>
        <h1>${esc(term)}</h1>
        ${intro}
      </div>
    </section>
    <section class="container post-grid-wrap">
      <div class="post-grid">${cards}</div>
    </section>`;

  return layout(ctx, content);
};
