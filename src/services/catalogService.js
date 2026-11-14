import { apiRequest } from "../lib/apiClient";

// In-memory cache storage with TTL and in-flight promise deduplication
const cacheMap = new Map();

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
      () => apiRequest(endpoint, { skipAuthRetry: true }),
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
        }),
      options.force,
    );
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
