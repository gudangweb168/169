/* ============================================================
   partials/header.js — Header situs & navigasi (TEMA)
   Mendukung menu bertingkat (children) + tombol hamburger mobile.
   ============================================================ */

module.exports = function header(ctx) {
  const { config, U, lib } = ctx;
  const { esc, attr } = lib;

  // Tautan navigasi yang aman untuk URL internal maupun eksternal.
  function navHref(url) {
    const u = String(url || "/");
    if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
    return U.url(u);
  }

  function navItemHtml(n) {
    const children = Array.isArray(n.children) ? n.children.filter((c) => c && c.label) : [];
    if (!children.length) {
      return `<a class="nav-link" href="${attr(navHref(n.url || "/"))}">${esc(n.label)}</a>`;
    }
    const sub = children
      .map((c) => `<a class="submenu-link" href="${attr(navHref(c.url || "/"))}">${esc(c.label)}</a>`)
      .join("");
    return `
      <div class="nav-parent">
        <a class="nav-link nav-link-parent" href="${attr(navHref(n.url || "#"))}">${esc(n.label)}<span class="caret" aria-hidden="true">▾</span></a>
        <button class="submenu-toggle" type="button" aria-label="Buka submenu ${attr(n.label)}" aria-expanded="false">▾</button>
        <div class="submenu">${sub}</div>
      </div>`;
  }

  const navItems = (config.nav || []).map(navItemHtml).join("");
  const brand = config.logo
    ? `<a href="${attr(U.url("/"))}" class="site-logo site-logo-img"><img src="${attr(U.url(config.logo))}" alt="${attr(config.title)}"></a>`
    : `<a href="${attr(U.url("/"))}" class="site-logo">${esc(config.title)}</a>`;

  return `
  <header class="site-header">
    <div class="container header-inner">
      ${brand}
      <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="site-nav">
        <span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Navigasi utama">${navItems}</nav>
    </div>
  </header>`;
};
