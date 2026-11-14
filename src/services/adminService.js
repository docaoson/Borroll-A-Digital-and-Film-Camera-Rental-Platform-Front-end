import { apiRequest, uploadFileToPresignedUrl } from "../lib/apiClient";
import { catalogService } from "./catalogService";

/**
 * Automatically resizes and compresses large images to lightweight WebP on client-side
 * before uploading to Supabase Storage so catalog images load 5x-10x faster.
 */
async function compressImageBeforeUpload(
  file,
  { maxDimension = 1280, quality = 0.82 } = {},
) {
  if (
    !file ||
    typeof document === "undefined" ||
    typeof Image === "undefined" ||
    !file.type?.startsWith("image/")
  ) {
    return file;
  }

  // Skip tiny files (< 120KB) that are already WebP
  if (file.type === "image/webp" && file.size <= 120 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { naturalWidth: width, naturalHeight: height } = img;
      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = (file.name || "image").replace(/\.[^.]+$/, "");
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

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

  getPayments(params = {}) {
    return apiRequest(`/staff/payments${buildQuery(params)}`);
  },

  confirmPayment(id) {
    return apiRequest(`/staff/payments/${encodeURIComponent(id)}/confirm`, { method: "POST" });
  },

  rejectPayment(id, reason) {
    return apiRequest(`/staff/payments/${encodeURIComponent(id)}/reject`, { method: "POST", body: { reason } });
  },

  presignPaymentQr(contentType, fileSize) {
    return apiRequest("/admin/payment-settings/qr/presign", { method: "POST", body: { contentType, fileSize } });
  },

  updateContactSettings(payload) {
    return apiRequest("/admin/contact-settings", { method: "PUT", body: payload });
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
    const optimizedFile = await compressImageBeforeUpload(file);
    const contentType = optimizedFile.type || "image/jpeg";
    const presignRes = await this.presignHandoverPhoto({
      bookingId,
      contentType,
    });
    await uploadFileToPresignedUrl(presignRes.uploadUrl, optimizedFile);
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

  async createAdminModel(payload) {
    const res = await apiRequest("/admin/models", {
      method: "POST",
      body: payload,
    });
    catalogService.clearCache();
    return res;
  },

  async updateAdminModel(id, payload) {
    const res = await apiRequest(`/admin/models/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
    catalogService.clearCache();
    return res;
  },

  async deleteAdminModel(id) {
    const res = await apiRequest(`/admin/models/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    catalogService.clearCache();
    return res;
  },

  // Technical Specs for Model
  async updateModelSpecs(id, specsPayload) {
    const res = await apiRequest(
      `/admin/models/${encodeURIComponent(id)}/specs`,
      {
        method: "PUT",
        body: specsPayload,
      },
    );
    catalogService.clearCache();
    return res;
  },

  // Model Images Management
  presignModelImage(id, contentType) {
    return apiRequest(`/admin/models/${encodeURIComponent(id)}/images/presign`, {
      method: "POST",
      body: { contentType },
    });
  },

  async addModelImage(id, payload) {
    const res = await apiRequest(
      `/admin/models/${encodeURIComponent(id)}/images`,
      {
        method: "POST",
        body: payload,
      },
    );
    catalogService.clearCache();
    return res;
  },

  async reorderModelImages(id, imageIds) {
    const res = await apiRequest(
      `/admin/models/${encodeURIComponent(id)}/images/order`,
      {
        method: "PATCH",
        body: { imageIds },
      },
    );
    catalogService.clearCache();
    return res;
  },

  async deleteModelImage(id, imageId) {
    const res = await apiRequest(
      `/admin/models/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      },
    );
    catalogService.clearCache();
    return res;
  },

  // High-level helper: upload file to S3/Storage and register to model
  async uploadModelImage(modelId, file, options = {}) {
    const { kind = "PRODUCT", caption = null, sampleLens = null, sortOrder = 0 } = options;
    const optimizedFile = await compressImageBeforeUpload(file);
    const contentType = optimizedFile.type || "image/jpeg";
    const presignRes = await this.presignModelImage(modelId, contentType);
    await uploadFileToPresignedUrl(presignRes.uploadUrl, optimizedFile);
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

  getAdminUnit(id) {
    return apiRequest(`/admin/units/${encodeURIComponent(id)}`);
  },

  createAdminUnit(payload) {
    return apiRequest("/admin/units", {
      method: "POST",
      body: payload,
    });
  },

  updateAdminUnit(id, payload) {
    return apiRequest(`/admin/units/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteAdminUnit(id) {
    return apiRequest(`/admin/units/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
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
