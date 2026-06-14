/* ============================================================
   templates/post.js — Artikel tunggal (TEMA)
   Menampilkan sidebar bila config.profile.sidebar diisi.
   ctx: { config, U, lib, site, seo, themeVars, post, related }
   ============================================================ */

var layout = require("./partials/layout");
var sidebar = require("./partials/sidebar");

module.exports = function post(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib, post = ctx.post, related = ctx.related;
  var esc = lib.esc, attr = lib.attr, slugify = lib.slugify, formatDate = lib.formatDate;

  var cat = post.meta.category
    ? '<a href="' + attr(U.url("/category/" + slugify(post.meta.category) + "/")) + '" class="post-cat">' + esc(post.meta.category) + "</a>"
    : "";

  var tags = (Array.isArray(post.meta.tags) && post.meta.tags.length)
    ? '<div class="post-tags">' + post.meta.tags
        .map(function (t) { return '<a href="' + attr(U.url("/tag/" + slugify(t) + "/")) + '" class="tag">#' + esc(t) + "</a>"; })
        .join("") + "</div>"
    : "";

  var featuredFig = post.ogImage
    ? '<figure class="post-hero-img"><img src="' + attr(U.url(post.featuredImage)) + '" alt="' + attr(post.meta.title) + '"></figure>'
    : "";

  var meta =
    '<div class="post-meta">' +
    (post.meta.author ? "<span>oleh " + esc(post.meta.author) + '</span><span class="dot">·</span>' : "") +
    '<time datetime="' + attr(post.meta.date) + '">' + esc(formatDate(post.meta.date, config.language)) + "</time>" +
    '<span class="dot">·</span>' +
    "<span>" + post.readingTime + " menit baca</span>" +
    "</div>";

  var header = '<header class="post-header">' + cat + '<h1 class="post-title">' + esc(post.meta.title) + "</h1>" + meta + "</header>";
  // HTML tambahan dari plugin setelah isi (mis. blok FAQ).
  var pluginAfter = (ctx.plugins && ctx.plugins.contentAfter) ? ctx.plugins.contentAfter(ctx) : "";
  var body = '<div class="post-content">\n' + post.html + "\n</div>" + (tags ? "\n" + tags : "") + pluginAfter;

  var relatedHtml = (related && related.length)
    ? '\n    <section class="related"><div class="container">' +
      '<h2 class="related-title">Artikel Lainnya</h2>' +
      '<div class="related-grid">' +
      related.map(function (p) {
        return '<a href="' + attr(U.url(p.permalink)) + '" class="related-card">' +
          '<span class="related-card-title">' + esc(p.meta.title) + "</span>" +
          '<span class="related-card-date">' + esc(formatDate(p.meta.date, config.language)) + "</span>" +
          "</a>";
      }).join("") +
      "</div></div></section>"
    : "";

  var blocks = sidebar.getSidebar(ctx);
  var article;
  if (blocks.length) {
    article =
      '\n    <article class="post">' +
      '\n      <div class="container"><div class="layout-sidebar">' +
      '\n        <div class="post-main">' + header + featuredFig + body + "</div>" +
      "\n        " + sidebar.render(ctx, blocks) +
      "\n      </div></div>" +
      "\n    </article>";
  } else {
    article =
      '\n    <article class="post">' +
      '\n      <div class="container post-narrow">' + header + "</div>" +
      (featuredFig ? '\n      <div class="container">' + featuredFig + "</div>" : "") +
      '\n      <div class="container post-narrow">' + body + "</div>" +
      "\n    </article>";
  }

  return layout(ctx, article + relatedHtml);
};
