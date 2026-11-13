import { apiRequest, uploadFileToPresignedUrl } from "../lib/apiClient";

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
  getBookingDetail(id) {
    return apiRequest(`/bookings/${encodeURIComponent(id)}`);
  },

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

  async uploadHandoverPhoto(bookingId, file) {
    const contentType = file.type || "image/jpeg";
    const presignRes = await this.presignHandoverPhoto({
      bookingId,
      contentType,
    });
    await uploadFileToPresignedUrl(presignRes.uploadUrl, file);
    return presignRes.path;
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

  // Technical Specs for Model
  updateModelSpecs(id, specsPayload) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}/specs`, {
      method: "PUT",
      body: specsPayload,
    });
  },

  // Model Images Management
  presignModelImage(id, contentType) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}/images/presign`, {
      method: "POST",
      body: { contentType },
    });
  },

  addModelImage(id, payload) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}/images`, {
      method: "POST",
      body: payload,
    });
  },

  reorderModelImages(id, imageIds) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}/images/order`, {
      method: "PATCH",
      body: { imageIds },
    });
  },

  deleteModelImage(id, imageId) {
    return apiRequest(
      `/admin/models/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      },
    );
  },

  // High-level helper: upload file to S3/Storage and register to model
  async uploadModelImage(modelId, file, options = {}) {
    const { kind = "PRODUCT", caption = null, sampleLens = null, sortOrder = 0 } = options;
    const contentType = file.type || "image/jpeg";
    const presignRes = await this.presignModelImage(modelId, contentType);
    await uploadFileToPresignedUrl(presignRes.uploadUrl, file);
    return this.addModelImage(modelId, {
      path: presignRes.path,
      kind,
      caption,
      sampleLens,
      sortOrder,
    });
  },

  // Categories (Admin)
  getAdminCategories(params = {}) {
    return apiRequest(`/admin/categories${buildQuery(params)}`);
  },

  createAdminCategory(payload) {
    return apiRequest("/admin/categories", {
      method: "POST",
      body: payload,
    });
  },

  updateAdminCategory(id, payload) {
    return apiRequest(`/admin/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteAdminCategory(id) {
    return apiRequest(`/admin/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  // Brands (Admin)
  getAdminBrands(params = {}) {
    return apiRequest(`/admin/brands${buildQuery(params)}`);
  },

  createAdminBrand(payload) {
    return apiRequest("/admin/brands", {
      method: "POST",
      body: payload,
    });
  },

  updateAdminBrand(id, payload) {
    return apiRequest(`/admin/brands/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteAdminBrand(id) {
    return apiRequest(`/admin/brands/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  // Branches (Admin)
  getAdminBranches(params = {}) {
    return apiRequest(`/admin/branches${buildQuery(params)}`);
  },

  createAdminBranch(payload) {
    return apiRequest("/admin/branches", {
      method: "POST",
      body: payload,
    });
  },

  updateAdminBranch(id, payload) {
    return apiRequest(`/admin/branches/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteAdminBranch(id) {
    return apiRequest(`/admin/branches/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  // Film Products (Admin)
  getAdminFilmProducts(params = {}) {
    return apiRequest(`/admin/film-products${buildQuery(params)}`);
  },

  createAdminFilmProduct(payload) {
    return apiRequest("/admin/film-products", {
      method: "POST",
      body: payload,
    });
  },

  updateAdminFilmProduct(id, payload) {
    return apiRequest(`/admin/film-products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteAdminFilmProduct(id) {
    return apiRequest(`/admin/film-products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  // Inventory Units (Staff / Admin)
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
