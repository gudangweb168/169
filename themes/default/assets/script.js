/* ============================================================
   theme/script.js — Interaksi header: menu mobile & submenu
   - Hamburger membuka/menutup drawer navigasi di mobile.
   - Submenu tampil saat hover di desktop (CSS), dan jadi
     accordion yang di-toggle tombol di mobile.
   ============================================================ */
(function () {
  "use strict";

  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");

  function closeNav() {
    if (!nav) return;
    nav.classList.remove("open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("is-active");
    }
    document.body.classList.remove("nav-open");
  }

  // Hamburger → buka/tutup drawer
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.classList.toggle("is-active", open);
      document.body.classList.toggle("nav-open", open);
    });

    // Klik tautan di dalam drawer → tutup drawer
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a.nav-link, a.submenu-link");
      if (link && !link.classList.contains("nav-link-parent") && nav.classList.contains("open")) {
        closeNav();
      }
    });
  }

  // Submenu accordion (mobile): tombol panah men-toggle parent-nya
  var subToggles = document.querySelectorAll(".submenu-toggle");
  for (var i = 0; i < subToggles.length; i++) {
    subToggles[i].addEventListener("click", function (e) {
      e.preventDefault();
      var parent = this.closest(".nav-parent");
      if (!parent) return;
      var open = parent.classList.toggle("submenu-open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Reset state saat layar membesar ke desktop
  var mq = window.matchMedia("(min-width: 721px)");
  function onChange() {
    if (mq.matches) {
      closeNav();
      var openSub = document.querySelectorAll(".nav-parent.submenu-open");
      for (var j = 0; j < openSub.length; j++) openSub[j].classList.remove("submenu-open");
    }
  }
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);

  // Tutup drawer dengan tombol Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav && nav.classList.contains("open")) closeNav();
  });
})();
