/* ============================================================
   partials/header.js — Header & navigasi (TEMA)
   Header tipis & lengket dengan logo, menu (mendukung submenu),
   dan satu tombol CTA (dari profile.primaryCta) untuk konversi.
   ============================================================ */

var profileMod = require("./profile");
var getProfile = profileMod.getProfile;
var navHref = profileMod.navHref;

module.exports = function header(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib;
  var esc = lib.esc, attr = lib.attr;

  function navItemHtml(n) {
    var children = Array.isArray(n.children) ? n.children.filter(function (c) { return c && c.label; }) : [];
    if (!children.length) {
      return '<a class="nav-link" href="' + attr(navHref(U, n.url || "/")) + '">' + esc(n.label) + "</a>";
    }
    var sub = children
      .map(function (c) { return '<a class="submenu-link" href="' + attr(navHref(U, c.url || "/")) + '">' + esc(c.label) + "</a>"; })
      .join("");
    return (
      '\n      <div class="nav-parent">' +
      '<a class="nav-link nav-link-parent" href="' + attr(navHref(U, n.url || "#")) + '">' + esc(n.label) + '<span class="caret" aria-hidden="true">▾</span></a>' +
      '<button class="submenu-toggle" type="button" aria-label="Buka submenu ' + attr(n.label) + '" aria-expanded="false">▾</button>' +
      '<div class="submenu">' + sub + "</div>" +
      "</div>"
    );
  }

  var navItems = (config.nav || []).map(navItemHtml).join("");

  var profile = getProfile(ctx);
  // Tombol CTA header: teks & URL dapat diubah; bisa disembunyikan total.
  // Catatan: pada tampilan mobile, tombol ini disembunyikan via CSS (.nav-cta).
  var cta = profile.headerCta.show
    ? '<a class="btn btn-primary nav-cta" href="' + attr(navHref(U, profile.headerCta.url)) + '">' + esc(profile.headerCta.text) + "</a>"
    : "";

  var brand = config.logo
    ? '<a href="' + attr(U.url("/")) + '" class="site-logo site-logo-img"><img src="' + attr(U.url(config.logo)) + '" alt="' + attr(config.title) + '"></a>'
    : '<a href="' + attr(U.url("/")) + '" class="site-logo">' + esc(config.title) + "</a>";

  return (
    '\n  <header class="site-header">' +
    '\n    <div class="container header-inner">' +
    "\n      " + brand +
    '\n      <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="site-nav">' +
    '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>' +
    "</button>" +
    '\n      <nav class="site-nav" id="site-nav" aria-label="Navigasi utama">' + navItems + cta + "</nav>" +
    "\n    </div>" +
    "\n  </header>"
  );
};
