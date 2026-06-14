/* ============================================================
   partials/resto.js — Penyusun data tema "Kuliner" (TEMA)
   Membaca ctx.themeContent (hasil dari menu "Sesuaikan") lalu
   mengembalikan objek yang sudah dinormalkan + diberi nilai
   fallback, sehingga beranda tetap rapi walau belum diisi.

   Kontrak emas: ini HANYA membaca data dari ctx (themeContent /
   config / U). TIDAK menyentuh GitHub API, filesystem, atau
   routing — itu sepenuhnya urusan inti.
   ============================================================ */

/* ---------- Util kecil ---------- */
function obj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function arr(v) {
  return Array.isArray(v) ? v : [];
}
function bool(v, dflt) {
  return v === undefined || v === null || v === "" ? dflt : v !== false;
}
function num(v, dflt) {
  var n = parseInt(v, 10);
  return isNaN(n) ? dflt : n;
}

// Tautan aman untuk URL internal (diawali basePath) maupun eksternal.
function navHref(U, url) {
  var u = String(url || "");
  if (!u) return "#";
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
  return U.url(u);
}

// URL aman untuk media/gambar: URL absolut (http/https, protocol-relative //,
// atau data:) dibiarkan apa adanya; path lokal/relatif diawali basePath via U.url.
function mediaUrl(U, url) {
  var u = String(url || "");
  if (!u) return "";
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
  return U.url(u);
}

// Ambil hanya digit dari sebuah harga ("Rp 25.000" / 25000 / "25,000") → 25000.
function hargaToNumber(v) {
  if (typeof v === "number" && isFinite(v)) return Math.round(v);
  var digits = String(v == null ? "" : v).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// Format angka rupiah dengan pemisah ribuan (tanpa simbol; simbol dari currency).
function formatRibuan(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Format harga lengkap untuk tampilan ("Rp25.000"). value boleh angka/teks.
function formatHarga(value, currency) {
  var n = hargaToNumber(value);
  var cur = (currency || "Rp").trim();
  if (!n) return "";
  return (cur ? cur + " " : "") + formatRibuan(n);
}

/* ---------- Susun data tema ---------- */
function getResto(ctx) {
  var config = ctx.config || {};
  var c = obj(ctx.themeContent);          // sumber utama (menu "Sesuaikan")

  var hero = obj(c.hero);
  var search = obj(c.search);
  var cats = obj(c.categories);
  var products = obj(c.products);
  var location = obj(c.location);
  var order = obj(c.order);
  var cta = obj(c.cta);

  /* -- Hero slider -- */
  var slides = arr(hero.slides)
    .map(function (s) {
      s = obj(s);
      return {
        image: s.image || "",
        title: s.title || "",
        subtitle: s.subtitle || "",
        buttonText: s.buttonText || "",
        buttonUrl: s.buttonUrl || "",
      };
    })
    .filter(function (s) { return s.image || s.title || s.subtitle; });

  /* -- Kategori (dengan foto) -- */
  var categoryItems = arr(cats.items)
    .map(function (it) {
      it = obj(it);
      return {
        name: (it.name || "").trim(),
        image: it.image || "",
        filter: (it.filter || "").trim(),   // kategori post yang dicocokkan (opsional)
      };
    })
    .filter(function (it) { return it.name; });

  /* -- Order / WhatsApp -- */
  var waDigits = String(order.whatsapp || "").replace(/[^\d]/g, "");

  /* -- CTA -- */
  var hasCta = !!(cta.title || cta.text);

  /* -- Lokasi -- */
  var hasLocation = !!(location.address || location.mapsEmbed || location.phone || location.title);

  return {
    /* Hero */
    hero: {
      enabled: bool(hero.enabled, true),
      autoplay: bool(hero.autoplay, true),
      interval: Math.max(2, num(hero.interval, 5)),   // detik
      slides: slides,
    },

    /* Pencarian */
    search: {
      enabled: bool(search.enabled, true),
      placeholder: search.placeholder || "Cari menu favoritmu…",
    },

    /* Kategori */
    categories: {
      enabled: bool(cats.enabled, true) && categoryItems.length > 0,
      eyebrow: cats.eyebrow || "Mau makan apa hari ini?",
      title: cats.title || "Pilih Kategori",
      items: categoryItems,
    },

    /* Produk / menu */
    products: {
      enabled: bool(products.enabled, true),
      eyebrow: products.eyebrow || "Menu Kami",
      title: products.title || "Daftar Menu",
      intro: products.intro || "",
      source: (products.source === "kategori") ? "kategori" : "terbaru",
      category: (products.category || "").trim(),
      limit: Math.max(0, num(products.limit, 0)),     // 0 = tampilkan semua
      showPrice: bool(products.showPrice, true),
      showCategoryFilter: bool(products.showCategoryFilter, true),
    },

    /* Lokasi & kontak */
    location: hasLocation
      ? {
          enabled: bool(location.enabled, true),
          title: location.title || "Lokasi & Kontak",
          address: location.address || "",
          mapsEmbed: location.mapsEmbed || "",
          mapsLink: location.mapsLink || "",
          phone: location.phone || "",
          hours: location.hours || "",
        }
      : null,

    /* Pengaturan order via WhatsApp */
    order: {
      whatsapp: waDigits,                 // hanya digit, mis. 628123456789
      storeName: order.storeName || config.title || "",
      greeting: order.greeting || "Halo, saya ingin memesan:",
      currency: order.currency || "Rp",
      note: order.note || "",
    },

    /* CTA */
    cta: hasCta
      ? {
          enabled: bool(cta.enabled, true),
          title: cta.title || "",
          text: cta.text || "",
          buttonText: cta.buttonText || "Pesan Sekarang",
          buttonUrl: cta.buttonUrl || "#menu",
        }
      : null,
  };
}

module.exports = {
  getResto: getResto,
  navHref: navHref,
  mediaUrl: mediaUrl,
  hargaToNumber: hargaToNumber,
  formatHarga: formatHarga,
  formatRibuan: formatRibuan,
};
