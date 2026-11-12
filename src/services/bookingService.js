import { apiRequest } from "../lib/apiClient";

export const bookingService = {
  quote(payload) {
    return apiRequest("/bookings/quote", {
      method: "POST",
      body: payload,
      skipAuthRetry: true,
    });
  },

  createBooking(payload) {
    return apiRequest("/bookings", {
      method: "POST",
      body: payload,
    });
  },

  getMyBookings(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
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

