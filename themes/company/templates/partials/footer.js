/* ============================================================
   partials/footer.js — Footer situs + widget (TEMA)
   Bagian atas: widget footer (jika ada) dari data inti (ctx.site).
   Bagian utama: kolom brand, tautan cepat, dan kontak.
   Tipe widget didukung: text, recent-posts, categories, tags, social.
   ============================================================ */

var iconsMod = require("./icons");
var socialLinks = iconsMod.socialLinks;
var profileMod = require("./profile");
var navHref = profileMod.navHref;

function widgetBlock(w, ctx) {
  var U = ctx.U, lib = ctx.lib, site = ctx.site;
  var esc = lib.esc, attr = lib.attr, slugify = lib.slugify;
  var type = String((w && w.type) || "").toLowerCase();
  var title = w && w.title ? '<h3 class="widget-title">' + esc(w.title) + "</h3>" : "";
  var body = "";

  if (type === "text") {
    body = '<div class="widget-text">' + (w.content || "") + "</div>";
  } else if (type === "recent-posts") {
    var n = parseInt(w.count, 10) || 5;
    body = '<ul class="widget-list">' + (site.recentPosts || []).slice(0, n)
      .map(function (p) { return '<li><a href="' + attr(U.url(p.permalink)) + '">' + esc(p.meta.title) + "</a></li>"; })
      .join("") + "</ul>";
  } else if (type === "categories") {
    body = '<ul class="widget-list">' + (site.categoryNames || [])
      .map(function (name) { return '<li><a href="' + attr(U.url("/category/" + slugify(name) + "/")) + '">' + esc(name) + "</a></li>"; })
      .join("") + "</ul>";
  } else if (type === "tags") {
    var m = parseInt(w.count, 10) || 20;
    body = '<div class="widget-tags">' + (site.tagNames || []).slice(0, m)
      .map(function (t) { return '<a class="widget-tag" href="' + attr(U.url("/tag/" + slugify(t) + "/")) + '">#' + esc(t) + "</a>"; })
      .join("") + "</div>";
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
  return '\n    <div class="footer-widgets">\n      <div class="container footer-widgets-grid">' + cols.join("") + "</div>\n    </div>";
}

// Kumpulkan tautan cepat (maks 6) dari menu navigasi.
function quickLinks(config, U, lib) {
  var esc = lib.esc, attr = lib.attr;
  var out = [];
  var seen = {};
  function push(label, url) {
    if (!label) return;
    var key = String(label).toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    out.push('<li><a href="' + attr(navHref(U, url || "/")) + '">' + esc(label) + "</a></li>");
  }
  (config.nav || []).forEach(function (n) {
    var children = Array.isArray(n.children) ? n.children.filter(function (c) { return c && c.label; }) : [];
    if (children.length) {
      children.forEach(function (c) { push(c.label, c.url); });
    } else {
      push(n.label, n.url);
    }
  });
  return out.slice(0, 6).join("");
}

module.exports = function footer(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib;
  var esc = lib.esc, attr = lib.attr;

  var year = new Date().getFullYear();
  var copyright =
    config.footerCopyright && String(config.footerCopyright).trim()
      ? esc(config.footerCopyright)
      : "© " + year + " " + esc(config.author || config.title) + ".";

  var social = config.social || {};
  var links = quickLinks(config, U, lib);

  var contactItems = [];
  if (social.email) {
    contactItems.push('<li><a href="mailto:' + attr(social.email) + '">' + esc(social.email) + "</a></li>");
  }
  contactItems.push('<li><a href="' + attr(U.url("/about/")) + '">Tentang Kami</a></li>');

  var contactCol =
    '<div class="footer-col footer-contact">' +
    '<h4 class="footer-col-title">Kontak</h4>' +
    '<ul class="footer-links">' + contactItems.join("") + "</ul>" +
    "</div>";

  var linksCol = links
    ? '<div class="footer-col"><h4 class="footer-col-title">Tautan</h4><ul class="footer-links">' + links + "</ul></div>"
    : "";

  return (
    '\n  <footer class="site-footer">' +
    renderWidgets(ctx) +
    '\n    <div class="container footer-main">' +
    '\n      <div class="footer-col footer-brand">' +
    '\n        <div class="footer-brand-name">' + esc(config.title) + "</div>" +
    '\n        <p class="footer-brand-desc">' + esc(config.tagline || config.description || "") + "</p>" +
    "\n        " + socialLinks(config, lib) +
    "\n      </div>" +
    "\n      " + linksCol +
    "\n      " + contactCol +
    "\n    </div>" +
    '\n    <div class="container footer-bottom">' +
    "\n      <span>" + copyright + "</span>" +
    '\n      <a href="https://www.gudangweb.com" target="_blank" rel="noopener">Build with GitCMS</a>' +
    "\n    </div>" +
    "\n  </footer>"
  );
};
