import { apiRequest } from "../lib/apiClient";

// In-memory cache storage with TTL and in-flight promise deduplication
const cacheMap = new Map();
const preconnectedOrigins = new Set();
const preloadedImageUrls = new Set();

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
  const cached = cacheMap.get(key);

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
      return data;
    })
    .catch((err) => {
      cacheMap.delete(key);
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

  getBranches(options = {}) {
    return cachedRequest(
      "branches",
      10 * 60 * 1000,
      () => apiRequest("/branches", { skipAuthRetry: true }),
      options.force,
    );
  },

  getCategories(options = {}) {
    return cachedRequest(
      "categories",
      10 * 60 * 1000,
      () => apiRequest("/categories", { skipAuthRetry: true }),
      options.force,
    );
  },

  getBrands(options = {}) {
    return cachedRequest(
      "brands",
      10 * 60 * 1000,
      () => apiRequest("/brands", { skipAuthRetry: true }),
      options.force,
    );
  },

  getFilmProducts(options = {}) {
    return cachedRequest(
      "film-products",
      10 * 60 * 1000,
      () => apiRequest("/film-products", { skipAuthRetry: true }),
      options.force,
    );
  },

  getModels(params = {}, options = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.set(key, String(val));
      }
    });
    const qs = query.toString();
    const endpoint = `/models${qs ? `?${qs}` : ""}`;
    // Cache filtered catalog model lists for 60 seconds
    return cachedRequest(
      `models:${qs}`,
      60 * 1000,
      () =>
        apiRequest(endpoint, { skipAuthRetry: true }).then((res) => {
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
      3 * 60 * 1000,
      () =>
        apiRequest(`/models/${encodeURIComponent(slug)}`, {
          skipAuthRetry: true,
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
