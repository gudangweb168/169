/* ============================================================
   templates/home.js — Beranda (TEMA Kuliner)
   Halaman 1 = landing bergaya aplikasi pesan-antar:
     hero slider → kotak pencarian → kategori (berfoto) →
     menu produk (grid desktop / list mobile, tombol + ke
     keranjang) → lokasi & kontak → CTA.
   Halaman 2+ = indeks "Semua Menu" sederhana dengan paginasi.

   Pemilihan produk diambil dari ctx.site.recentPosts (daftar
   penuh) lalu disaring/dibatasi sesuai pengaturan "Sesuaikan".
   Pencarian & filter kategori berjalan di sisi-klien (script.js)
   memakai atribut data-* pada tiap kartu produk.
   ctx: { config, U, lib, site, seo, themeVars, themeContent,
          posts, pageNum, totalPages }
   ============================================================ */

var layout = require("./partials/layout");
var productCard = require("./partials/product-card");
var icons = require("./partials/icons");
var restoMod = require("./partials/resto");
var navHref = restoMod.navHref;
var mediaUrl = restoMod.mediaUrl;

module.exports = function home(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib;
  var esc = lib.esc, attr = lib.attr, slugify = lib.slugify;
  var pageNum = ctx.pageNum, totalPages = ctx.totalPages;
  var resto = restoMod.getResto(ctx);

  /* ============================================================
     Halaman 2+ : indeks "Semua Menu" + paginasi
     ============================================================ */
  if (pageNum > 1) {
    var cardsP = (ctx.posts || []).map(function (p) { return productCard(p, ctx); }).join("");
    var prevP = pageNum > 1
      ? '<a class="page-link" href="' + attr(U.url(pageNum === 2 ? "/" : "/page/" + (pageNum - 1) + "/")) + '">← Sebelumnya</a>'
      : '<span class="page-link disabled">← Sebelumnya</span>';
    var nextP = pageNum < totalPages
      ? '<a class="page-link" href="' + attr(U.url("/page/" + (pageNum + 1) + "/")) + '">Berikutnya →</a>'
      : '<span class="page-link disabled">Berikutnya →</span>';
    var idx =
      '\n    <section class="page-head"><div class="container"><span class="page-head-kicker">Menu</span><h1>Semua Menu — Halaman ' + pageNum + "</h1></div></section>" +
      '\n    <section class="menu"><div class="container">' +
      '<div class="menu-grid">' + cardsP + "</div>" +
      '\n      <nav class="pagination">' + prevP + '<span class="page-info">Halaman ' + pageNum + " dari " + totalPages + "</span>" + nextP + "</nav>" +
      "\n    </div></section>";
    return layout(ctx, idx);
  }

  /* ============================================================
     Halaman 1 : landing
     ============================================================ */

  /* -------- 1. Hero slider (fullwidth) -------- */
  function slideHtml(s) {
    var hasImg = !!s.image;
    var bg = hasImg ? ' style="background-image:url(\'' + attr(mediaUrl(U, s.image)) + '\')"' : "";
    var t = s.title ? '<h2 class="hero-title">' + esc(s.title) + "</h2>" : "";
    var sub = s.subtitle ? '<p class="hero-sub">' + esc(s.subtitle) + "</p>" : "";
    var btn = (s.buttonText && s.buttonUrl)
      ? '<a class="btn btn-primary btn-lg" href="' + attr(navHref(U, s.buttonUrl)) + '">' + esc(s.buttonText) + "</a>"
      : "";
    return (
      '\n        <div class="hero-slide' + (hasImg ? "" : " hero-slide-plain") + '"' + bg + ">" +
      '<div class="hero-overlay" aria-hidden="true"></div>' +
      '<div class="container hero-slide-inner"><div class="hero-content">' + t + sub + btn + "</div></div>" +
      "</div>"
    );
  }

  var slides = resto.hero.slides;
  // Fallback bila slider belum diisi: satu slide polos dari identitas situs.
  if (!slides.length) {
    slides = [{
      image: "",
      title: config.title || "Selamat Datang",
      subtitle: config.tagline || config.description || "Pesan makanan favoritmu, langsung dari meja.",
      buttonText: "Lihat Menu",
      buttonUrl: "#menu",
    }];
  }
  var heroSlides = slides.map(slideHtml).join("");
  var multi = slides.length > 1;
  var hero = "";
  if (resto.hero.enabled) {
    hero =
      '\n    <section class="hero-slider" data-slider data-autoplay="' + (resto.hero.autoplay && multi ? "1" : "0") + '" data-interval="' + (resto.hero.interval * 1000) + '" aria-label="Sorotan">' +
      '\n      <div class="hero-track" data-slider-track>' + heroSlides + "\n      </div>" +
      (multi
        ? '\n      <button type="button" class="hero-arrow hero-prev" data-slider-prev aria-label="Sebelumnya">‹</button>' +
          '\n      <button type="button" class="hero-arrow hero-next" data-slider-next aria-label="Berikutnya">›</button>' +
          '\n      <div class="hero-dots" data-slider-dots aria-hidden="true"></div>'
        : "") +
      "\n    </section>";
  }

  /* -------- 2. Kotak pencarian -------- */
  var search = "";
  if (resto.search.enabled) {
    search =
      '\n    <section class="cari-sec">' +
      '\n      <div class="container">' +
      '\n        <div class="cari-box">' +
      '<span class="cari-ic" aria-hidden="true">' + icons.ui("search") + "</span>" +
      '<input type="search" id="menu-cari" class="cari-input" placeholder="' + attr(resto.search.placeholder) + '" autocomplete="off" aria-label="Cari menu">' +
      '<button type="button" class="cari-clear" id="menu-cari-clear" hidden aria-label="Hapus pencarian">' + icons.ui("close") + "</button>" +
      "</div>" +
      "\n      </div>" +
      "\n    </section>";
  }

  /* -------- 3. Kategori (berfoto, dapat diedit) -------- */
  var kategori = "";
  if (resto.categories.enabled) {
    var allChip =
      '<button type="button" class="kategori-card is-active" data-filter="" aria-pressed="true">' +
      '<span class="kategori-img kategori-img-all" aria-hidden="true">' + icons.ui("bag") + "</span>" +
      '<span class="kategori-nama">Semua</span>' +
      "</button>";
    var chips = resto.categories.items.map(function (it) {
      var slug = slugify(it.filter || it.name);
      var imgInner = it.image
        ? '<span class="kategori-img" style="background-image:url(\'' + attr(mediaUrl(U, it.image)) + '\')"></span>'
        : '<span class="kategori-img kategori-img-ph" aria-hidden="true">' + esc((it.name || "?").charAt(0).toUpperCase()) + "</span>";
      return (
        '<button type="button" class="kategori-card" data-filter="' + attr(slug) + '" aria-pressed="false">' +
        imgInner +
        '<span class="kategori-nama">' + esc(it.name) + "</span>" +
        "</button>"
      );
    }).join("");
    kategori =
      '\n    <section class="kategori" id="kategori">' +
      '\n      <div class="container">' +
      '\n        <div class="section-head"><span class="eyebrow">' + esc(resto.categories.eyebrow) + '</span><h2>' + esc(resto.categories.title) + "</h2></div>" +
      '\n        <div class="kategori-scroll" data-kategori-list>' + allChip + chips + "</div>" +
      "\n      </div>" +
      "\n    </section>";
  }

  /* -------- 4. Menu produk (grid desktop / list mobile) -------- */
  var menu = "";
  if (resto.products.enabled) {
    // Pool produk: seluruh artikel published (terbaru dulu).
    var pool = (ctx.site && ctx.site.recentPosts) ? ctx.site.recentPosts.slice() : [];
    if (resto.products.source === "kategori" && resto.products.category) {
      var want = slugify(resto.products.category);
      pool = pool.filter(function (p) { return slugify(p.meta.category || "") === want; });
    }
    var totalTersedia = pool.length;
    var shown = resto.products.limit > 0 ? pool.slice(0, resto.products.limit) : pool;

    var menuCards = shown.map(function (p) {
      return productCard(p, ctx, { showPrice: resto.products.showPrice, currency: resto.order.currency });
    }).join("");

    var intro = resto.products.intro ? "<p>" + esc(resto.products.intro) + "</p>" : "";

    // Tombol "lihat semua" hanya bila menu sengaja dibatasi & masih ada sisanya.
    var seeAll = "";
    if (shown.length < totalTersedia) {
      var seeUrl = totalPages > 1
        ? U.url("/page/2/")
        : (resto.products.source === "kategori" && resto.products.category
            ? U.url("/category/" + slugify(resto.products.category) + "/")
            : "");
      if (seeUrl) {
        seeAll =
          '\n        <div class="menu-more"><a class="btn btn-ghost" href="' + attr(seeUrl) + '">Lihat Semua Menu ' + icons.ui("arrow") + "</a></div>";
      }
    }

    var emptyMsg =
      '\n        <div class="menu-empty" id="menu-empty" hidden>' +
      '<span class="menu-empty-ic" aria-hidden="true">' + icons.ui("search") + "</span>" +
      "<p>Menu tidak ditemukan.</p><span>Coba kata kunci atau kategori lain.</span>" +
      "</div>";

    var gridOrEmpty = shown.length
      ? '<div class="menu-grid" id="menu-grid" data-menu>' + menuCards + "</div>" + emptyMsg
      : '<div class="menu-kosong"><p>Belum ada menu yang ditambahkan.</p><span>Tambahkan produk dari panel admin (setiap artikel = satu produk, lengkapi field <code>harga</code>).</span></div>';

    menu =
      '\n    <section class="menu" id="menu">' +
      '\n      <div class="container">' +
      '\n        <div class="section-head"><span class="eyebrow">' + esc(resto.products.eyebrow) + '</span><h2>' + esc(resto.products.title) + "</h2>" + intro + "</div>" +
      "\n        " + gridOrEmpty +
      seeAll +
      "\n      </div>" +
      "\n    </section>";
  }

  /* -------- 5. Lokasi & kontak -------- */
  var lokasi = "";
  if (resto.location && resto.location.enabled) {
    var L = resto.location;
    var mapHtml = (L.mapsEmbed && /^https?:\/\//i.test(L.mapsEmbed))
      ? '<iframe src="' + attr(L.mapsEmbed) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Peta lokasi"></iframe>'
      : '<div class="lokasi-map-ph">' + icons.ui("location") + "<span>Peta belum diatur</span></div>";

    var rows = "";
    if (L.address) rows += '<div class="lokasi-row">' + icons.ui("location") + "<span>" + esc(L.address) + "</span></div>";
    if (L.phone) rows += '<div class="lokasi-row">' + icons.ui("phone") + '<a href="tel:' + attr(L.phone.replace(/[^\d+]/g, "")) + '">' + esc(L.phone) + "</a></div>";
    if (L.hours) rows += '<div class="lokasi-row">' + icons.ui("clock") + "<span>" + esc(L.hours) + "</span></div>";
    var mapsBtn = L.mapsLink
      ? '<a class="btn btn-ghost" href="' + attr(L.mapsLink) + '" target="_blank" rel="noopener">' + icons.ui("location") + " Buka di Google Maps</a>"
      : "";

    lokasi =
      '\n    <section class="lokasi" id="lokasi">' +
      '\n      <div class="container">' +
      '\n        <div class="section-head"><span class="eyebrow">Kunjungi Kami</span><h2>' + esc(L.title) + "</h2></div>" +
      '\n        <div class="lokasi-grid">' +
      '\n          <div class="lokasi-map">' + mapHtml + "</div>" +
      '\n          <div class="lokasi-info">' + rows + (mapsBtn ? '<div class="lokasi-aksi">' + mapsBtn + "</div>" : "") + "</div>" +
      "\n        </div>" +
      "\n      </div>" +
      "\n    </section>";
  }

  /* -------- 6. CTA -------- */
  var cta = "";
  if (resto.cta && resto.cta.enabled) {
    var bandText = resto.cta.text ? "<p>" + esc(resto.cta.text) + "</p>" : "";
    cta =
      '\n    <section class="cta-band">' +
      '\n      <div class="container"><div class="cta-inner">' +
      "<h2>" + esc(resto.cta.title) + "</h2>" + bandText +
      '<div class="cta-actions"><a class="btn btn-light btn-lg" href="' + attr(navHref(U, resto.cta.buttonUrl)) + '">' + esc(resto.cta.buttonText) + "</a></div>" +
      "</div></div>" +
      "\n    </section>";
  }

  var content = hero + search + kategori + menu + lokasi + cta;
  return layout(ctx, content);
};
