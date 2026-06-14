/* ============================================================
   templates/page.js — Halaman statis (TEMA)
   Dipakai untuk Tentang, Layanan, Kontak, dll.
   Menampilkan sidebar bila config.profile.sidebar diisi.
   ctx: { config, U, lib, site, seo, themeVars, page }
   ============================================================ */

var layout = require("./partials/layout");
var sidebar = require("./partials/sidebar");

module.exports = function page(ctx) {
  var lib = ctx.lib, page = ctx.page;
  var esc = lib.esc;

  var lead = (page.meta && page.meta.excerpt)
    ? '<p class="page-lead">' + esc(page.meta.excerpt) + "</p>"
    : "";
  var header = '<header class="post-header"><h1 class="post-title">' + esc(page.meta.title) + "</h1>" + lead + "</header>";
  // HTML tambahan dari plugin setelah isi (mis. blok FAQ).
  var pluginAfter = (ctx.plugins && ctx.plugins.contentAfter) ? ctx.plugins.contentAfter(ctx) : "";
  var body = '<div class="post-content">\n' + page.html + "\n</div>" + pluginAfter;

  var blocks = sidebar.getSidebar(ctx);
  var content;
  if (blocks.length) {
    content =
      '\n    <article class="post">' +
      '\n      <div class="container"><div class="layout-sidebar">' +
      '\n        <div class="post-main">' + header + body + "</div>" +
      "\n        " + sidebar.render(ctx, blocks) +
      "\n      </div></div>" +
      "\n    </article>";
  } else {
    content =
      '\n    <article class="post">' +
      '\n      <div class="container post-narrow">' + header + body + "</div>" +
      "\n    </article>";
  }

  return layout(ctx, content);
};
