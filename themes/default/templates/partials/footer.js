/* ============================================================
   partials/footer.js — Footer situs + widget (TEMA)
   Widget dirender DI SINI dari data yang disediakan core lewat
   ctx.site (widgets, recentPosts, categoryNames, tagNames).
   Tipe widget: text (HTML), recent-posts, categories, tags, social.
   ============================================================ */

const { socialLinks } = require("./icons");

function widgetBlock(w, ctx) {
  const { U, lib, site } = ctx;
  const { esc, attr, slugify } = lib;
  const type = String((w && w.type) || "").toLowerCase();
  const title = w && w.title ? `<h3 class="widget-title">${esc(w.title)}</h3>` : "";
  let body = "";

  if (type === "text") {
    // Konten HTML dari pemilik repo (tepercaya), disisipkan apa adanya.
    body = `<div class="widget-text">${w.content || ""}</div>`;
  } else if (type === "recent-posts") {
    const n = parseInt(w.count, 10) || 5;
    const items = (site.recentPosts || [])
      .slice(0, n)
      .map((p) => `<li><a href="${attr(U.url(p.permalink))}">${esc(p.meta.title)}</a></li>`)
      .join("");
    body = `<ul class="widget-list">${items}</ul>`;
  } else if (type === "categories") {
    const items = (site.categoryNames || [])
      .map((name) => `<li><a href="${attr(U.url("/category/" + slugify(name) + "/"))}">${esc(name)}</a></li>`)
      .join("");
    body = `<ul class="widget-list">${items}</ul>`;
  } else if (type === "tags") {
    const n = parseInt(w.count, 10) || 20;
    const items = (site.tagNames || [])
      .slice(0, n)
      .map((t) => `<a class="widget-tag" href="${attr(U.url("/tag/" + slugify(t) + "/"))}">#${esc(t)}</a>`)
      .join("");
    body = `<div class="widget-tags">${items}</div>`;
  } else if (type === "social") {
    body = socialLinks(ctx.config, lib) || "";
  } else {
    return "";
  }

  return `<div class="footer-widget widget-${esc(type || "x")}">${title}${body}</div>`;
}

function renderWidgets(ctx) {
  const widgets = (ctx.site && ctx.site.widgets) || [];
  if (!Array.isArray(widgets) || !widgets.length) return "";
  const cols = widgets.map((w) => widgetBlock(w, ctx)).filter(Boolean);
  if (!cols.length) return "";
  return `
    <div class="footer-widgets">
      <div class="container footer-widgets-grid">${cols.join("")}</div>
    </div>`;
}

module.exports = function footer(ctx) {
  const { config, lib } = ctx;
  const { esc } = lib;

  const year = new Date().getFullYear();
  const copyright =
    config.footerCopyright && String(config.footerCopyright).trim()
      ? esc(config.footerCopyright)
      : `© ${year} ${esc(config.author || config.title)}.${config.footerText ? " " + esc(config.footerText) : ""}`;

  const widgets = renderWidgets(ctx);

  return `
  <footer class="site-footer">
    ${widgets}
    <div class="container footer-inner">
      <div>
        <div class="footer-title">${esc(config.title)}</div>
        <p class="footer-desc">${esc(config.tagline || "")}</p>
      </div>
      ${socialLinks(config, lib)}
    </div>
    <div class="container footer-bottom">
      <span>${copyright}</span>
      <a href="https://www.gudangweb.com" target="_blank" rel="noopener">Build with GitCMS</a>
    </div>
  </footer>`;
};
