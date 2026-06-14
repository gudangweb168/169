/* ============================================================
   config.js — Manajemen konfigurasi (localStorage)
   Menyimpan: token, owner, repo, branch, dan path konten.
   ============================================================ */

const Config = (() => {
  const KEYS = {
    token: "gitcms_token",
    owner: "gitcms_owner",
    repo: "gitcms_repo",
    branch: "gitcms_branch",
    path: "gitcms_path",
    pagesPath: "gitcms_pages_path",
    categoriesFile: "gitcms_categories_file",
    widgetsFile: "gitcms_widgets_file",
  };

  const DEFAULT_PAGES = "content/pages";
  const DEFAULT_CATEGORIES = "content/categories.json";
  const DEFAULT_WIDGETS = "content/widgets.json";

  return {
    /** Ambil seluruh konfigurasi sebagai objek */
    getAll() {
      return {
        token: localStorage.getItem(KEYS.token) || "",
        owner: localStorage.getItem(KEYS.owner) || "",
        repo: localStorage.getItem(KEYS.repo) || "",
        branch: localStorage.getItem(KEYS.branch) || "main",
        path: localStorage.getItem(KEYS.path) || "content/posts",
        pagesPath: localStorage.getItem(KEYS.pagesPath) || DEFAULT_PAGES,
        categoriesFile: localStorage.getItem(KEYS.categoriesFile) || DEFAULT_CATEGORIES,
        widgetsFile: localStorage.getItem(KEYS.widgetsFile) || DEFAULT_WIDGETS,
      };
    },

    /** Path folder halaman statis */
    getPagesPath() {
      return localStorage.getItem(KEYS.pagesPath) || DEFAULT_PAGES;
    },

    /** Path file daftar kategori (JSON) */
    getCategoriesFile() {
      return localStorage.getItem(KEYS.categoriesFile) || DEFAULT_CATEGORIES;
    },

    /** Path file daftar widget (JSON) */
    getWidgetsFile() {
      return localStorage.getItem(KEYS.widgetsFile) || DEFAULT_WIDGETS;
    },

    /** Simpan token saja */
    setToken(token) {
      localStorage.setItem(KEYS.token, token.trim());
    },

    getToken() {
      return localStorage.getItem(KEYS.token) || "";
    },

    /** Simpan konfigurasi repository */
    setRepoConfig({ owner, repo, branch, path, pagesPath, categoriesFile }) {
      localStorage.setItem(KEYS.owner, owner.trim());
      localStorage.setItem(KEYS.repo, repo.trim());
      localStorage.setItem(KEYS.branch, (branch || "main").trim());
      localStorage.setItem(KEYS.path, (path || "content/posts").trim().replace(/^\/+|\/+$/g, ""));
      localStorage.setItem(KEYS.pagesPath, (pagesPath || DEFAULT_PAGES).trim().replace(/^\/+|\/+$/g, ""));
      localStorage.setItem(KEYS.categoriesFile, (categoriesFile || DEFAULT_CATEGORIES).trim().replace(/^\/+/, ""));
    },

    /** Cek apakah token sudah ada */
    hasToken() {
      return !!this.getToken();
    },

    /** Cek apakah konfigurasi repo sudah lengkap */
    hasRepoConfig() {
      const c = this.getAll();
      return !!(c.owner && c.repo);
    },

    /** Hapus token saja (logout) */
    clearToken() {
      localStorage.removeItem(KEYS.token);
    },

    /** Hapus seluruh konfigurasi */
    clearAll() {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    },
  };
})();
