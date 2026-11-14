import { apiRequest } from "../lib/apiClient";

// In-memory cache storage with TTL and in-flight promise deduplication
const cacheMap = new Map();
const preconnectedOrigins = new Set();
const preloadedImageUrls = new Set();
const STORAGE_CACHE_PREFIX = "borroll_catalog_v1:";
const STORAGE_STALE_MAX_MS = 24 * 60 * 60 * 1000; // 24 hours max stale retention

function readStorageCache(key) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`${STORAGE_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      parsed.data === undefined ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > STORAGE_STALE_MAX_MS
    ) {
      window.localStorage.removeItem(`${STORAGE_CACHE_PREFIX}${key}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorageCache(key, data, ttlMs) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const now = Date.now();
    window.localStorage.setItem(
      `${STORAGE_CACHE_PREFIX}${key}`,
      JSON.stringify({
        data,
        savedAt: now,
        expiresAt: now + ttlMs,
      }),
    );
  } catch {
    // Ignore storage quota errors
  }
}

function clearStorageCache(prefix) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const fullPrefix = `${STORAGE_CACHE_PREFIX}${prefix || ""}`;
    const keysToDelete = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) {
        keysToDelete.push(k);
      }
    }
    keysToDelete.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}

function peekCachedData(key) {
  const mem = cacheMap.get(key);
  if (mem?.data !== undefined) {
    return mem.data;
  }
  const stored = readStorageCache(key);
  if (stored?.data !== undefined) {
    cacheMap.set(key, {
      data: stored.data,
      expiresAt: stored.expiresAt || 0,
      inFlight: null,
    });
    return stored.data;
  }
  return null;
}

function buildModelsQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.set(key, String(val));
    }
  });
  return query.toString();
}

function ensureStoragePreconnect(url) {
  if (!url || typeof document === "undefined") return;
  try {
    const origin = new URL(url).origin;
    if (!origin || preconnectedOrigins.has(origin)) return;
    preconnectedOrigins.add(origin);
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  } catch {
    // Ignore invalid URLs
  }
}

function preloadImageUrl(url) {
  if (!url || typeof Image === "undefined" || preloadedImageUrls.has(url)) {
    return;
  }
  preloadedImageUrls.add(url);
  ensureStoragePreconnect(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

function getTodayMonthIso() {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    return `${year}-${month}`;
  } catch {
    return new Date().toISOString().slice(0, 7);
  }
}

/**
 * Cache helper that deduplicates concurrent in-flight promises
 * and caches resolved responses for ttlMs milliseconds.
 */
function cachedRequest(key, ttlMs, fetcher, force = false) {
  const now = Date.now();
  let cached = cacheMap.get(key);

  if (!cached) {
    const stored = readStorageCache(key);
    if (stored?.data !== undefined) {
      cached = {
        data: stored.data,
        expiresAt: stored.expiresAt || 0,
        inFlight: null,
      };
      cacheMap.set(key, cached);
    }
  }

  if (!force && cached) {
    if (cached.inFlight) {
      return cached.inFlight;
    }
    if (cached.data !== undefined && now < cached.expiresAt) {
      return Promise.resolve(cached.data);
    }
  }

  const promise = fetcher()
    .then((data) => {
      cacheMap.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
        inFlight: null,
      });
      writeStorageCache(key, data, ttlMs);
      return data;
    })
    .catch((err) => {
      if (cached?.data !== undefined) {
        cacheMap.set(key, {
          data: cached.data,
          expiresAt: cached.expiresAt || 0,
          inFlight: null,
        });
      } else {
        cacheMap.delete(key);
      }
      throw err;
    });

  cacheMap.set(key, {
    data: cached?.data,
    expiresAt: cached?.expiresAt || 0,
    inFlight: promise,
  });

  return promise;
}

export const catalogService = {
  // Clear cache entries matching a prefix, or entire cache if no prefix given
  clearCache(prefix) {
    clearStorageCache(prefix);
    if (!prefix) {
      cacheMap.clear();
      return;
    }
    for (const key of cacheMap.keys()) {
      if (key.startsWith(prefix)) {
        cacheMap.delete(key);
      }
    }
  },

  peekBranches() {
    return peekCachedData("branches");
  },

  peekCategories() {
    return peekCachedData("categories");
  },

  peekBrands() {
    return peekCachedData("brands");
  },

  peekModels(params = {}) {
    const qs = buildModelsQueryString(params);
    return peekCachedData(`models:${qs}`);
  },

  peekModelBySlug(slug) {
    if (!slug) return null;
    return peekCachedData(`model:${slug}`);
  },

  getBranches(options = {}) {
    return cachedRequest(
      "branches",
      10 * 60 * 1000,
      () =>
        apiRequest("/branches", { skipAuthRetry: true, publicEndpoint: true }),
      options.force,
    );
  },

  getCategories(options = {}) {
    return cachedRequest(
      "categories",
      10 * 60 * 1000,
      () =>
        apiRequest("/categories", {
          skipAuthRetry: true,
          publicEndpoint: true,
        }),
      options.force,
    );
  },

  getBrands(options = {}) {
    return cachedRequest(
      "brands",
      10 * 60 * 1000,
      () =>
        apiRequest("/brands", { skipAuthRetry: true, publicEndpoint: true }),
      options.force,
    );
  },

  getFilmProducts(options = {}) {
    return cachedRequest(
      "film-products",
      10 * 60 * 1000,
      () =>
        apiRequest("/film-products", {
          skipAuthRetry: true,
          publicEndpoint: true,
        }),
      options.force,
    );
  },

  getModels(params = {}, options = {}) {
    const qs = buildModelsQueryString(params);
    const endpoint = `/models${qs ? `?${qs}` : ""}`;
    // Fetch directly or with short cache (5s) for instant sync when admin creates models
    return cachedRequest(
      `models:${qs}`,
      5 * 1000,
      () =>
        apiRequest(endpoint, {
          skipAuthRetry: true,
          publicEndpoint: true,
        }).then((res) => {
          const items = res?.items || [];
          if (items[0]?.thumbnailUrl) {
            ensureStoragePreconnect(items[0].thumbnailUrl);
          }
          items.slice(0, 4).forEach((item) => {
            if (item?.thumbnailUrl) preloadImageUrl(item.thumbnailUrl);
          });
          return res;
        }),
      options.force,
    );
  },

  getModelBySlug(slug, options = {}) {
    return cachedRequest(
      `model:${slug}`,
      10 * 1000,
      () =>
        apiRequest(`/models/${encodeURIComponent(slug)}`, {
          skipAuthRetry: true,
          publicEndpoint: true,
        }).then((data) => {
          const firstUrl = data?.images?.[0]?.url;
          if (firstUrl) preloadImageUrl(firstUrl);
          return data;
        }),
      options.force,
    );
  },

  prefetchModelBySlug(slug) {
    if (!slug) return;
    catalogService
      .getModelBySlug(slug)
      .then((model) => {
        if (model?.id) {
          const defaultBranch = model.availableAtBranches?.[0] || "tay-ho";
          catalogService
            .getModelAvailability(model.id, defaultBranch, getTodayMonthIso())
            .catch(() => {});
        }
      })
      .catch(() => {});
  },

  prefetchCatalogList() {
    catalogService.getCategories().catch(() => {});
    catalogService.getBrands().catch(() => {});
    catalogService
      .getModels({ sort: "default", page: 1, pageSize: 9 })
      .catch(() => {});
  },

  getModelAvailability(id, branch, month, options = {}) {
    const query = new URLSearchParams({ branch, month });
    const qs = query.toString();
    return cachedRequest(
      `avail:${id}:${branch}:${month}`,
      2 * 60 * 1000,
      () =>
        apiRequest(`/models/${encodeURIComponent(id)}/availability?${qs}`, {
          skipAuthRetry: true,
          publicEndpoint: true,
        }),
      options.force,
    );
  },

  getFavorites(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.set(key, String(val));
      }
    });
    const qs = query.toString();
    return apiRequest(`/favorites${qs ? `?${qs}` : ""}`);
  },

  toggleFavorite(modelId, shouldFavorite) {
    const method = shouldFavorite ? "POST" : "DELETE";
    catalogService.clearCache("models:");
    catalogService.clearCache("model:");
    return apiRequest(`/favorites/${encodeURIComponent(modelId)}`, {
      method,
    });
  },
};
