import { apiRequest } from "../lib/apiClient";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.set(key, String(val));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const adminService = {
  // Staff & Admin Operations Dashboard
  getStaffDashboard(params = {}) {
    return apiRequest(`/staff/dashboard${buildQuery(params)}`);
  },

  // Staff & Admin Bookings List
  getStaffBookings(params = {}) {
    return apiRequest(`/staff/bookings${buildQuery(params)}`);
  },

  // Booking Actions
  confirmBooking(id) {
    return apiRequest(`/staff/bookings/${encodeURIComponent(id)}/confirm`, {
      method: "POST",
    });
  },

  rejectBooking(id, reason) {
    return apiRequest(`/staff/bookings/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: { reason },
    });
  },

  cancelBooking(id, reason) {
    return apiRequest(`/staff/bookings/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      body: { reason },
    });
  },

  pickupBooking(id, payload) {
    return apiRequest(`/staff/bookings/${encodeURIComponent(id)}/pickup`, {
      method: "POST",
      body: payload,
    });
  },

  returnBooking(id, payload) {
    return apiRequest(`/staff/bookings/${encodeURIComponent(id)}/return`, {
      method: "POST",
      body: payload,
    });
  },

  completeBooking(id, payload) {
    return apiRequest(`/staff/bookings/${encodeURIComponent(id)}/complete`, {
      method: "POST",
      body: payload,
    });
  },

  // Handover Photo Presign
  presignHandoverPhoto(payload) {
    return apiRequest("/staff/handover-photos/presign", {
      method: "POST",
      body: payload,
    });
  },

  // Admin User Management (ADMIN only)
  getAdminUsers(params = {}) {
    return apiRequest(`/admin/users${buildQuery(params)}`);
  },

  updateAdminUser(id, payload) {
    return apiRequest(`/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  // Catalog Models (Admin)
  getAdminModels(params = {}) {
    return apiRequest(`/admin/models${buildQuery(params)}`);
  },

  getAdminModel(id) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}`);
  },

  createAdminModel(payload) {
    return apiRequest("/admin/models", {
      method: "POST",
      body: payload,
    });
  },

  updateAdminModel(id, payload) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteAdminModel(id) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  // Categories & Brands (Admin)
  getAdminCategories() {
    return apiRequest("/admin/categories");
  },

  getAdminBrands() {
    return apiRequest("/admin/brands");
  },

  getAdminBranches() {
    return apiRequest("/admin/branches");
  },

  // Inventory Units
  getStaffUnits(params = {}) {
    return apiRequest(`/staff/units${buildQuery(params)}`);
  },

  getAdminUnits(params = {}) {
    return apiRequest(`/admin/units${buildQuery(params)}`);
  },

  getStaffUnitBlocks(params = {}) {
    return apiRequest(`/staff/unit-blocks${buildQuery(params)}`);
  },

  createStaffUnitBlock(payload) {
    return apiRequest("/staff/unit-blocks", {
      method: "POST",
      body: payload,
    });
  },

  deleteStaffUnitBlock(id) {
    return apiRequest(`/staff/unit-blocks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
