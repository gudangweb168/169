/* ============================================================
   seo.js — Perakit SEO per halaman (CORE)
   Mengembalikan objek SEO baku untuk tiap jenis halaman:
     { title, description, canonical, ogType, ogImage, jsonLd: [..] }
   Tema hanya MERENDER objek ini di partial head.js — sehingga
   meta, Open Graph, Twitter Card, dan JSON-LD (schema.org) tetap
   benar & konsisten DI SEMUA TEMA tanpa tema perlu tahu schema.
   ============================================================ */

const { slugify } = require("./util");

/* ---------- Beranda (termasuk halaman paginasi) ---------- */
function homeSeo({ config, U, pageNum }) {
  const isFirst = pageNum === 1;
  return {
    title: isFirst ? "" : `Halaman ${pageNum}`,
    description: config.description,
    canonical: isFirst ? U.baseUrl + "/" : U.abs("/page/" + pageNum + "/"),
    ogType: "website",
    ogImage: "",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: config.title,
        url: U.baseUrl + "/",
        description: config.description,
        inLanguage: config.language || "id",
      },
    ],
  };
}

/* ---------- Artikel tunggal: BlogPosting + BreadcrumbList ---------- */
function postSeo({ config, U, post }) {
  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta.title,
    description: post.excerpt,
    datePublished: post.meta.date,
    dateModified: post.meta.date,
    author: { "@type": "Person", name: post.meta.author || config.author },
    publisher: {
      "@type": "Organization",
      name: config.title,
      ...(config.defaultOgImage ? { logo: { "@type": "ImageObject", url: U.abs(config.defaultOgImage) } } : {}),
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": U.abs(post.permalink) },
    inLanguage: config.language || "id",
    ...(post.ogImage ? { image: post.ogImage } : {}),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: U.baseUrl + "/" },
      { "@type": "ListItem", position: 2, name: post.meta.title, item: U.abs(post.permalink) },
    ],
  };
  return {
    title: post.meta.title,
    description: post.excerpt,
    canonical: U.abs(post.permalink),
    ogType: "article",
    ogImage: post.ogImage || "",
    jsonLd: [blogPosting, breadcrumb],
  };
}

/* ---------- Halaman statis (about, dll) ---------- */
function pageSeo({ config, U, page }) {
  return {
    title: page.meta.title,
    description: page.meta.excerpt || page.meta.title,
    canonical: U.abs(page.permalink),
    ogType: "website",
    ogImage: "",
    jsonLd: [],
  };
}

/* ---------- Arsip kategori / tag ---------- */
function archiveSeo({ kind, term, description, U }) {
  const label = kind === "category" ? "Kategori" : "Tag";
  const hasDesc = description && String(description).trim();
  return {
    title: `${label}: ${term}`,
    description: hasDesc ? description : `Kumpulan artikel dalam ${label.toLowerCase()} ${term}.`,
    canonical: U.abs("/" + kind + "/" + slugify(term) + "/"),
    ogType: "website",
    ogImage: "",
    jsonLd: [],
  };
}

/* ---------- 404 ---------- */
function notFoundSeo({ U }) {
  return {
    title: "404",
    description: "Halaman tidak ditemukan",
    canonical: U.baseUrl + "/",
    ogType: "website",
    ogImage: "",
    jsonLd: [],
  };
}

module.exports = { homeSeo, postSeo, pageSeo, archiveSeo, notFoundSeo };
