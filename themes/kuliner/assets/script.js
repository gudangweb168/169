/* ============================================================
   themes/kuliner/assets/script.js — Interaksi tema "Kuliner"
   Semua logika sisi-klien untuk pengalaman pesan-antar:
     1. Drawer navigasi (mobile) + submenu accordion + header scrolled
     2. Hero slider (autoplay, panah, titik)
     3. Pencarian menu (filter kartu berdasarkan nama)
     4. Filter kategori (chip berdasarkan data-kategori)
     5. Keranjang belanja (localStorage + fallback memori)
     6. Nomor meja (?meja=NN) → badge & info keranjang
     7. Checkout via WhatsApp (rangkai pesan dari isi keranjang)

   Konfigurasi situs dibaca dari window.__KULINER__ (disuntik oleh
   layout.js): { wa, store, greeting, currency, note, basePath }.
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.__KULINER__ || {};
  var CART_KEY = "kuliner_cart_v1";
  var MEJA_KEY = "kuliner_meja";
  var CURRENCY = (CFG.currency || "Rp").trim();

  /* ---------- Util kecil ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function ribuan(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function rupiah(n) {
    var v = Math.round(Number(n) || 0);
    return (CURRENCY ? CURRENCY + " " : "") + ribuan(v);
  }

  /* Ikon kecil untuk elemen yang dibuat oleh JS (baris keranjang). */
  var ICO = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l-.8 12.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 7Z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/></svg>'
  };

  /* ============================================================
     1. DRAWER NAVIGASI + SUBMENU + HEADER SCROLLED
     ============================================================ */
  var header = $(".site-header");
  var navToggle = $("#nav-toggle");
  var nav = $("#site-nav");

  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function closeNav() {
    if (!nav) return;
    nav.classList.remove("open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.classList.remove("is-active");
    }
    document.body.classList.remove("nav-open");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.classList.toggle("is-active", open);
      document.body.classList.toggle("nav-open", open);
    });
    // Klik tautan biasa di dalam drawer → tutup.
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a.nav-link, a.submenu-link");
      if (link && !link.classList.contains("nav-link-parent") && nav.classList.contains("open")) closeNav();
    });
  }

  // Submenu accordion (mobile).
  $all(".submenu-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var parent = this.closest(".nav-parent");
      if (!parent) return;
      var open = parent.classList.toggle("submenu-open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // Reset saat layar membesar ke desktop.
  var mq = window.matchMedia("(min-width: 861px)");
  function onMq() {
    if (mq.matches) {
      closeNav();
      $all(".nav-parent.submenu-open").forEach(function (p) { p.classList.remove("submenu-open"); });
    }
  }
  if (mq.addEventListener) mq.addEventListener("change", onMq);
  else if (mq.addListener) mq.addListener(onMq);

  // Klik di luar drawer → tutup.
  document.addEventListener("click", function (e) {
    if (!nav || !nav.classList.contains("open")) return;
    if (e.target.closest("#nav-toggle") || e.target.closest("#site-nav")) return;
    closeNav();
  });

  /* ============================================================
     2. HERO SLIDER
     ============================================================ */
  $all("[data-slider]").forEach(function (slider) {
    var track = $("[data-slider-track]", slider);
    if (!track) return;
    var slides = $all(".hero-slide", track);
    if (slides.length <= 1) return;          // tidak perlu kontrol untuk 1 slide

    var dotsWrap = $("[data-slider-dots]", slider);
    var prevBtn = $("[data-slider-prev]", slider);
    var nextBtn = $("[data-slider-next]", slider);
    var autoplay = slider.getAttribute("data-autoplay") === "1";
    var interval = parseInt(slider.getAttribute("data-interval"), 10) || 5000;
    var idx = 0, timer = null;

    // Bangun titik (dot) navigasi.
    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var d = document.createElement("button");
        d.type = "button";
        d.className = "hero-dot" + (i === 0 ? " is-active" : "");
        d.setAttribute("aria-label", "Slide " + (i + 1));
        d.addEventListener("click", function () { go(i, true); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }

    function render() {
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
    }
    function go(i, stop) {
      idx = (i + slides.length) % slides.length;
      render();
      if (stop) rest();
    }
    function next() { go(idx + 1); }
    function start() { if (autoplay) { stop(); timer = setInterval(next, interval); } }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function rest() { stop(); start(); }   // reset hitungan autoplay setelah interaksi

    if (prevBtn) prevBtn.addEventListener("click", function () { go(idx - 1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(idx + 1, true); });

    // Jeda autoplay saat kursor di atas slider.
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);

    // Geser dengan sentuhan (swipe).
    var x0 = null;
    track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), true);
      else start();
      x0 = null;
    });

    render();
    start();
  });

  /* ============================================================
     3 & 4. PENCARIAN + FILTER KATEGORI
     Keduanya bekerja pada #menu-grid dan digabung (AND).
     ============================================================ */
  var grid = $("#menu-grid");
  var cariInput = $("#menu-cari");
  var cariClear = $("#menu-cari-clear");
  var kategoriList = $("[data-kategori-list]");
  var emptyBox = $("#menu-empty");
  var activeQuery = "";
  var activeCat = "";

  function applyFilter() {
    if (!grid) return;
    var cards = $all(".produk-card", grid);
    var visible = 0;
    cards.forEach(function (card) {
      var nama = (card.getAttribute("data-cari") || "").toLowerCase();
      var kat = card.getAttribute("data-kategori") || "";
      var okQuery = !activeQuery || nama.indexOf(activeQuery) !== -1;
      var okCat = !activeCat || kat === activeCat;
      var show = okQuery && okCat;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    });
    if (emptyBox) emptyBox.hidden = visible !== 0;
  }

  if (cariInput) {
    cariInput.addEventListener("input", function () {
      activeQuery = this.value.trim().toLowerCase();
      if (cariClear) cariClear.hidden = !activeQuery;
      applyFilter();
    });
  }
  if (cariClear) {
    cariClear.addEventListener("click", function () {
      activeQuery = "";
      if (cariInput) { cariInput.value = ""; cariInput.focus(); }
      this.hidden = true;
      applyFilter();
    });
  }
  if (kategoriList) {
    kategoriList.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-filter]");
      if (!chip) return;
      activeCat = chip.getAttribute("data-filter") || "";
      $all("[data-filter]", kategoriList).forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      applyFilter();
      // Gulir lembut ke daftar menu agar hasil filter terlihat.
      var menuSec = document.getElementById("menu");
      if (menuSec) menuSec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ============================================================
     5. KERANJANG (localStorage + fallback memori)
     Item: { id, nama, harga(angka), gambar, qty }
     ============================================================ */
  var memStore = {};                 // cadangan bila localStorage diblokir
  function lsGet(key) {
    try { return window.localStorage.getItem(key); }
    catch (e) { return memStore[key] != null ? memStore[key] : null; }
  }
  function lsSet(key, val) {
    try { window.localStorage.setItem(key, val); }
    catch (e) { memStore[key] = val; }
  }
  function lsDel(key) {
    try { window.localStorage.removeItem(key); }
    catch (e) { delete memStore[key]; }
  }

  var cart = [];
  (function loadCart() {
    var raw = lsGet(CART_KEY);
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      if (Array.isArray(data)) {
        cart = data.filter(function (it) { return it && it.id; }).map(function (it) {
          return {
            id: String(it.id),
            nama: String(it.nama || ""),
            harga: Math.max(0, Math.round(Number(it.harga) || 0)),
            gambar: String(it.gambar || ""),
            qty: Math.max(1, parseInt(it.qty, 10) || 1)
          };
        });
      }
    } catch (e) { cart = []; }
  })();

  function saveCart() { lsSet(CART_KEY, JSON.stringify(cart)); }
  function cartCount() { return cart.reduce(function (s, it) { return s + it.qty; }, 0); }
  function cartTotal() { return cart.reduce(function (s, it) { return s + it.harga * it.qty; }, 0); }
  function findItem(id) { for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i]; return null; }

  function addItem(data) {
    var it = findItem(data.id);
    if (it) it.qty += 1;
    else cart.push({ id: data.id, nama: data.nama, harga: data.harga, gambar: data.gambar, qty: 1 });
    saveCart();
    renderCart();
  }
  function setQty(id, qty) {
    var it = findItem(id);
    if (!it) return;
    it.qty = qty;
    if (it.qty <= 0) cart = cart.filter(function (x) { return x.id !== id; });
    saveCart();
    renderCart();
  }
  function removeItem(id) {
    cart = cart.filter(function (x) { return x.id !== id; });
    saveCart();
    renderCart();
  }

  // Elemen keranjang
  var cartBtn = $("#cart-btn");
  var cartFab = $("#cart-fab");
  var cartScrim = $("#cart-scrim");
  var cartDrawer = $("#cart-drawer");
  var cartClose = $("#cart-close");
  var cartItemsEl = $("#cart-items");
  var cartEmptyEl = $("#cart-empty");
  var cartCheckout = $("#cart-checkout");

  function renderCart() {
    var count = cartCount();
    var total = cartTotal();

    // Penghitung (di tombol header & FAB) + total (di FAB & footer drawer).
    $all("[data-cart-count]").forEach(function (el) {
      el.textContent = String(count);
      // Lencana di tombol header disembunyikan saat kosong.
      if (el.classList.contains("cart-count")) el.hidden = count === 0;
    });
    $all("[data-cart-total]").forEach(function (el) { el.textContent = count ? rupiah(total) : "—"; });

    // FAB tampil hanya bila ada isi.
    if (cartFab) cartFab.hidden = count === 0;
    document.body.classList.toggle("has-cart", count > 0);

    // Daftar item / status kosong.
    if (cartItemsEl) {
      if (!cart.length) {
        cartItemsEl.innerHTML = "";
      } else {
        cartItemsEl.innerHTML = cart.map(function (it) {
          var thumb = it.gambar
            ? '<img class="cart-item-thumb" src="' + esc(it.gambar) + '" alt="' + esc(it.nama) + '">'
            : '<span class="cart-item-thumb-ph" aria-hidden="true">' + ICO.bag + "</span>";
          var hargaSatuan = it.harga ? rupiah(it.harga) : "Hubungi kami";
          var sub = it.harga ? '<span class="cart-item-sub">' + esc(rupiah(it.harga * it.qty)) + "</span>" : "";
          return (
            '<div class="cart-item" data-line="' + esc(it.id) + '">' +
            thumb +
            '<div class="cart-item-main">' +
            '<p class="cart-item-nama">' + esc(it.nama) + "</p>" +
            '<p class="cart-item-harga">' + esc(hargaSatuan) + "</p>" +
            sub +
            "</div>" +
            '<div class="cart-item-side">' +
            '<div class="cart-qty">' +
            '<button type="button" class="qty-btn" data-dec aria-label="Kurangi">' + ICO.minus + "</button>" +
            '<span class="qty-num">' + it.qty + "</span>" +
            '<button type="button" class="qty-btn" data-inc aria-label="Tambah">' + ICO.plus + "</button>" +
            "</div>" +
            '<button type="button" class="cart-item-del" data-del aria-label="Hapus item">' + ICO.trash + "</button>" +
            "</div>" +
            "</div>"
          );
        }).join("");
      }
    }
    if (cartEmptyEl) cartEmptyEl.hidden = cart.length > 0;
    if (cartCheckout) cartCheckout.disabled = cart.length === 0;
  }

  // Tambah ke keranjang: tombol [data-add] di kartu/halaman produk.
  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add]");
    if (!addBtn || addBtn.disabled) return;
    var host = addBtn.closest("[data-id]");
    if (!host) return;
    addItem({
      id: String(host.getAttribute("data-id")),
      nama: host.getAttribute("data-nama") || "",
      harga: Math.max(0, Math.round(Number(host.getAttribute("data-harga")) || 0)),
      gambar: host.getAttribute("data-gambar") || ""
    });
    // Umpan balik visual + buka keranjang (di mobile cukup tampilkan FAB).
    var card = addBtn.closest(".produk-card");
    if (card) { card.classList.remove("just-added"); void card.offsetWidth; card.classList.add("just-added"); }
    openCart();
  });

  // Aksi di dalam daftar keranjang (qty +/- dan hapus).
  if (cartItemsEl) {
    cartItemsEl.addEventListener("click", function (e) {
      var row = e.target.closest("[data-line]");
      if (!row) return;
      var id = row.getAttribute("data-line");
      var it = findItem(id);
      if (!it) return;
      if (e.target.closest("[data-inc]")) setQty(id, it.qty + 1);
      else if (e.target.closest("[data-dec]")) setQty(id, it.qty - 1);
      else if (e.target.closest("[data-del]")) removeItem(id);
    });
  }

  /* ---- Buka / tutup drawer keranjang ---- */
  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    if (cartScrim) { cartScrim.hidden = false; requestAnimationFrame(function () { cartScrim.classList.add("show"); }); }
    document.body.classList.add("cart-open");
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    if (cartScrim) {
      cartScrim.classList.remove("show");
      setTimeout(function () { cartScrim.hidden = true; }, 320);
    }
    document.body.classList.remove("cart-open");
  }
  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (cartFab) cartFab.addEventListener("click", openCart);
  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (cartScrim) cartScrim.addEventListener("click", closeCart);

  // Escape menutup drawer keranjang lalu drawer navigasi.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (cartDrawer && cartDrawer.classList.contains("open")) closeCart();
    else if (nav && nav.classList.contains("open")) closeNav();
  });

  /* ============================================================
     6. NOMOR MEJA (?meja=NN)
     ============================================================ */
  var mejaBadge = $("#meja-badge");
  var mejaText = $("[data-meja-text]");
  var cartMeja = $("[data-cart-meja]");
  var cartMejaText = $("[data-cart-meja-text]");
  var cartMejaClear = $("[data-cart-meja-clear]");

  function readMejaParam() {
    try {
      var p = new URLSearchParams(window.location.search).get("meja");
      if (p == null) return null;
      p = String(p).trim();
      return p ? p.slice(0, 12) : null;     // batasi panjang agar aman
    } catch (e) { return null; }
  }
  function currentMeja() { var fromUrl = readMejaParam(); return fromUrl != null ? fromUrl : (lsGet(MEJA_KEY) || ""); }

  function applyMeja() {
    var meja = currentMeja();
    if (meja) lsSet(MEJA_KEY, meja);
    var label = meja ? "Meja " + meja : "";
    if (mejaBadge) { mejaBadge.hidden = !meja; if (mejaText) mejaText.textContent = label; }
    if (cartMeja) { cartMeja.hidden = !meja; if (cartMejaText) cartMejaText.textContent = label; }
  }
  if (cartMejaClear) {
    cartMejaClear.addEventListener("click", function () {
      lsDel(MEJA_KEY);
      // Hapus juga parameter ?meja dari URL agar tidak terbaca ulang.
      try {
        var url = new URL(window.location.href);
        url.searchParams.delete("meja");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      } catch (e) {}
      applyMeja();
    });
  }

  /* ============================================================
     7. CHECKOUT VIA WHATSAPP
     ============================================================ */
  if (cartCheckout) {
    cartCheckout.addEventListener("click", function () {
      if (!cart.length) return;
      var wa = String(CFG.wa || "").replace(/[^\d]/g, "");
      if (!wa) {
        alert("Nomor WhatsApp penerima pesanan belum diatur. Silakan atur lewat menu \u201cSesuaikan\u201d pada panel admin.");
        return;
      }
      var lines = [];
      lines.push(CFG.greeting || "Halo, saya ingin memesan:");
      if (CFG.store) lines.push("(" + CFG.store + ")");
      var meja = currentMeja();
      if (meja) lines.push("Meja: " + meja);
      lines.push("");
      cart.forEach(function (it, i) {
        var harga = it.harga ? rupiah(it.harga * it.qty) : "(tanya harga)";
        lines.push((i + 1) + ". " + it.nama + " x" + it.qty + " — " + harga);
      });
      lines.push("");
      lines.push("Total: " + rupiah(cartTotal()));
      if (CFG.note) { lines.push(""); lines.push(CFG.note); }

      var url = "https://wa.me/" + wa + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------- Inisialisasi ---------- */
  applyMeja();
  renderCart();
})();
