import { apiRequest } from "../lib/apiClient";

const quoteCache = new Map();

export const bookingService = {
  quote(payload, options = {}) {
    const key = JSON.stringify(payload);
    const now = Date.now();
    const cached = quoteCache.get(key);

    if (!options.force && cached) {
      if (cached.inFlight) return cached.inFlight;
      if (cached.data !== undefined && now < cached.expiresAt) {
        return Promise.resolve(cached.data);
      }
    }

    const promise = apiRequest("/bookings/quote", {
      method: "POST",
      body: payload,
      skipAuthRetry: true,
    })
      .then((data) => {
        quoteCache.set(key, {
          data,
          expiresAt: Date.now() + 60 * 1000,
          inFlight: null,
        });
        return data;
      })
      .catch((err) => {
        quoteCache.delete(key);
        throw err;
      });

    quoteCache.set(key, {
      data: cached?.data,
      expiresAt: cached?.expiresAt || 0,
      inFlight: promise,
    });

    return promise;
  },

  createBooking(payload) {
    const headers = {};
    if (payload?.idempotencyKey) {
      headers["Idempotency-Key"] = payload.idempotencyKey;
    }
    return apiRequest("/bookings", {
      method: "POST",
      headers,
      body: payload,
    });
  },

  getMyBookings(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    const qs = query.toString();
    return apiRequest(`/bookings${qs ? `?${qs}` : ""}`);
  },

  getBookingDetail(id) {
    return apiRequest(`/bookings/${encodeURIComponent(id)}`);
  },

  cancelBooking(id, reason) {
    return apiRequest(`/bookings/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      body: reason ? { reason } : {},
    });
  },
};

