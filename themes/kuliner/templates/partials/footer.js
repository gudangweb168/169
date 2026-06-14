/* ============================================================
   partials/footer.js — Footer situs + widget (TEMA Kuliner)
   Widget dirender DI SINI dari data yang disediakan core lewat
   ctx.site (widgets, recentPosts, categoryNames, tagNames).
   Tipe widget: text (HTML), recent-posts, categories, tags, social.
   ============================================================ */

var icons = require("./icons");
var socialLinks = icons.socialLinks;

function widgetBlock(w, ctx) {
  var U = ctx.U, lib = ctx.lib, site = ctx.site;
  var esc = lib.esc, attr = lib.attr, slugify = lib.slugify;
  var type = String((w && w.type) || "").toLowerCase();
  var title = w && w.title ? '<h3 class="widget-title">' + esc(w.title) + "</h3>" : "";
  var body = "";

  if (type === "text") {
    // Konten HTML dari pemilik repo (tepercaya), disisipkan apa adanya.
    body = '<div class="widget-text">' + (w.content || "") + "</div>";
  } else if (type === "recent-posts") {
    var n = parseInt(w.count, 10) || 5;
    var items = (site.recentPosts || [])
      .slice(0, n)
      .map(function (p) { return '<li><a href="' + attr(U.url(p.permalink)) + '">' + esc(p.meta.title) + "</a></li>"; })
      .join("");
    body = '<ul class="widget-list">' + items + "</ul>";
  } else if (type === "categories") {
    var catItems = (site.categoryNames || [])
      .map(function (name) { return '<li><a href="' + attr(U.url("/category/" + slugify(name) + "/")) + '">' + esc(name) + "</a></li>"; })
      .join("");
    body = '<ul class="widget-list">' + catItems + "</ul>";
  } else if (type === "tags") {
    var tn = parseInt(w.count, 10) || 20;
    var tagItems = (site.tagNames || [])
      .slice(0, tn)
      .map(function (t) { return '<a class="widget-tag" href="' + attr(U.url("/tag/" + slugify(t) + "/")) + '">#' + esc(t) + "</a>"; })
      .join("");
    body = '<div class="widget-tags">' + tagItems + "</div>";
  } else if (type === "social") {
    body = socialLinks(ctx.config, lib) || "";
  } else {
    return "";
  }

  return '<div class="footer-widget widget-' + esc(type || "x") + '">' + title + body + "</div>";
}

function renderWidgets(ctx) {
  var widgets = (ctx.site && ctx.site.widgets) || [];
  if (!Array.isArray(widgets) || !widgets.length) return "";
  var cols = widgets.map(function (w) { return widgetBlock(w, ctx); }).filter(Boolean);
  if (!cols.length) return "";
  return (
    '\n    <div class="footer-widgets">' +
    '\n      <div class="container footer-widgets-grid">' + cols.join("") + "</div>" +
    "\n    </div>"
  );
}

module.exports = function footer(ctx) {
  var config = ctx.config, lib = ctx.lib;
  var esc = lib.esc;

  var year = new Date().getFullYear();
  var copyright =
    config.footerCopyright && String(config.footerCopyright).trim()
      ? esc(config.footerCopyright)
      : "© " + year + " " + esc(config.author || config.title) + "." + (config.footerText ? " " + esc(config.footerText) : "");

  var widgets = renderWidgets(ctx);

  return (
    '\n  <footer class="site-footer">' +
    widgets +
    '\n    <div class="container footer-inner">' +
    "\n      <div>" +
    '\n        <div class="footer-title">' + esc(config.title) + "</div>" +
    '\n        <p class="footer-desc">' + esc(config.tagline || "") + "</p>" +
    "\n      </div>" +
    "\n      " + socialLinks(config, lib) +
    "\n    </div>" +
    '\n    <div class="container footer-bottom">' +
    "\n      <span>" + copyright + "</span>" +
    '\n      <a href="https://www.gudangweb.com" target="_blank" rel="noopener">Build with GitCMS</a>' +
    "\n    </div>" +
    "\n  </footer>"
  );
};
