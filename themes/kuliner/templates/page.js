/* ============================================================
   templates/page.js — Halaman statis (TEMA Kuliner)
   ctx: { config, U, lib, site, seo, themeVars, page }
   ============================================================ */

var layout = require("./partials/layout");

module.exports = function page(ctx) {
  var lib = ctx.lib, page = ctx.page;
  var esc = lib.esc;

  var lead = page.meta.excerpt ? '<p class="page-lead">' + esc(page.meta.excerpt) + "</p>" : "";

  var content =
    '\n    <article class="halaman">' +
    '\n      <div class="container container-narrow">' +
    '\n        <header class="halaman-head">' +
    '\n          <h1 class="halaman-title">' + esc(page.meta.title) + "</h1>" +
    "\n          " + lead +
    "\n        </header>" +
    '\n        <div class="post-content">\n' + page.html + "\n        </div>" +
    "\n        " + ((ctx.plugins && ctx.plugins.contentAfter) ? ctx.plugins.contentAfter(ctx) : "") +
    "\n      </div>" +
    "\n    </article>";

  return layout(ctx, content);
};
