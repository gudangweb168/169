/* ============================================================
   templates/page.js — Halaman statis (TEMA)
   ctx: { config, U, lib, site, seo, themeVars, page }
   ============================================================ */

const layout = require("./partials/layout");

module.exports = function page(ctx) {
  const { lib, page } = ctx;
  const { esc } = lib;

  const content = `
    <article class="post">
      <div class="container post-narrow">
        <header class="post-header">
          <h1 class="post-title">${esc(page.meta.title)}</h1>
        </header>
        <div class="post-content">
${page.html}
        </div>
        ${(ctx.plugins && ctx.plugins.contentAfter) ? ctx.plugins.contentAfter(ctx) : ""}
      </div>
    </article>`;

  return layout(ctx, content);
};
