/* ============================================================
   partials/header.js — Header & navigasi (TEMA Kuliner)
   Header lengket bergaya aplikasi pesan-antar: logo, menu
   (mendukung submenu + drawer mobile), badge nomor meja
   (diisi JS dari ?meja=), dan tombol Keranjang dengan penghitung.
   ============================================================ */

var icons = require("./icons");

module.exports = function header(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib;
  var esc = lib.esc, attr = lib.attr;

  // Tautan navigasi aman untuk URL internal maupun eksternal.
  function navHref(url) {
    var u = String(url || "/");
    if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
    return U.url(u);
  }

  function navItemHtml(n) {
    var children = Array.isArray(n.children) ? n.children.filter(function (c) { return c && c.label; }) : [];
    if (!children.length) {
      return '<a class="nav-link" href="' + attr(navHref(n.url || "/")) + '">' + esc(n.label) + "</a>";
    }
    var sub = children
      .map(function (c) { return '<a class="submenu-link" href="' + attr(navHref(c.url || "/")) + '">' + esc(c.label) + "</a>"; })
      .join("");
    return (
      '\n      <div class="nav-parent">' +
      '<a class="nav-link nav-link-parent" href="' + attr(navHref(n.url || "#")) + '">' + esc(n.label) + '<span class="caret" aria-hidden="true">▾</span></a>' +
      '<button class="submenu-toggle" type="button" aria-label="Buka submenu ' + attr(n.label) + '" aria-expanded="false">▾</button>' +
      '<div class="submenu">' + sub + "</div>" +
      "</div>"
    );
  }

  var navItems = (config.nav || []).map(navItemHtml).join("");

  var brand = config.logo
    ? '<a href="' + attr(U.url("/")) + '" class="site-logo site-logo-img"><img src="' + attr(U.url(config.logo)) + '" alt="' + attr(config.title) + '"></a>'
    : '<a href="' + attr(U.url("/")) + '" class="site-logo">' + esc(config.title) + "</a>";

  // Badge nomor meja — tersembunyi awalnya; ditampilkan & diisi oleh script.js
  // saat halaman dibuka dengan ?meja=NN.
  var mejaBadge =
    '<button type="button" class="meja-badge" id="meja-badge" hidden aria-label="Nomor meja pesanan">' +
    icons.ui("table") +
    '<span class="meja-badge-text" data-meja-text></span>' +
    "</button>";

  // Tombol keranjang dengan penghitung jumlah item (diisi script.js).
  var cartBtn =
    '<button type="button" class="cart-btn" id="cart-btn" aria-label="Buka keranjang">' +
    icons.ui("cart") +
    '<span class="cart-count" data-cart-count hidden>0</span>' +
    "</button>";

  return (
    '\n  <header class="site-header" id="site-header">' +
    '\n    <div class="container header-inner">' +
    "\n      " + brand +
    '\n      <nav class="site-nav" id="site-nav" aria-label="Navigasi utama">' + navItems + "</nav>" +
    '\n      <div class="header-actions">' +
    "\n        " + mejaBadge +
    "\n        " + cartBtn +
    '\n        <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="site-nav">' +
    '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>' +
    "</button>" +
    "\n      </div>" +
    "\n    </div>" +
    "\n  </header>"
  );
};
