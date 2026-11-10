import { apiRequest } from "../lib/apiClient";

export const catalogService = {
  getBranches() {
    return apiRequest("/branches", { skipAuthRetry: true });
  },

  getCategories() {
    return apiRequest("/categories", { skipAuthRetry: true });
  },

  getBrands() {
    return apiRequest("/brands", { skipAuthRetry: true });
  },

  getFilmProducts() {
    return apiRequest("/film-products", { skipAuthRetry: true });
  },

  getModels(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.set(key, String(val));
      }
    });
    const qs = query.toString();
    return apiRequest(`/models${qs ? `?${qs}` : ""}`, { skipAuthRetry: true });
  },

  getModelBySlug(slug) {
    return apiRequest(`/models/${encodeURIComponent(slug)}`, {
      skipAuthRetry: true,
    });
  },

  getModelAvailability(id, branch, month) {
    const query = new URLSearchParams({ branch, month });
    return apiRequest(
      `/models/${encodeURIComponent(id)}/availability?${query.toString()}`,
      { skipAuthRetry: true },
    );
  },
};

