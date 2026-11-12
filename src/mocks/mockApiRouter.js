import { ApiError } from "../lib/apiClient";
import {
  mockBookingsSeed,
  mockBranches,
  mockBrands,
  mockCategories,
  mockFilmProducts,
  mockModels,
} from "./contractData";

const bookingsStore = [...mockBookingsSeed];
const favoriteModelIds = new Set();

function normalizeText(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseIsoUtcMs(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function computeModelRental(model, days) {
  if (model.pricePerWeek && days >= 7) {
    const weeks = Math.floor(days / 7);
    const remainderDays = days % 7;
    return weeks * model.pricePerWeek + remainderDays * model.pricePerDay;
  }
  return days * model.pricePerDay;
}

function toListItem(model) {
  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    kind: model.kind,
    cameraType: model.cameraType,
    brand: model.brand,
    category: model.category,
    mount: model.mount,
    pricePerDay: model.pricePerDay,
    pricePerWeek: model.pricePerWeek,
    deposit: model.deposit,
    thumbnailUrl: model.thumbnailUrl,
    isFeatured: model.isFeatured,
    badges: model.badges,
    isFavorite: favoriteModelIds.has(model.id),
    availableAtBranches: model.availableAtBranches,
    description: model.description,
  };
}

function handleGetModels(searchParams) {
  const q = normalizeText(searchParams.get("q") || "");
  const categoryParam = searchParams.get("category") || "";
  const brandParam = searchParams.get("brand") || "";
  const kind = searchParams.get("kind") || "";
  const cameraType = searchParams.get("cameraType") || "";
  const mount = searchParams.get("mount") || "";
  const branch = searchParams.get("branch") || "";
  const featured = searchParams.get("featured");
  const excludeId = searchParams.get("excludeId") || "";
  const sort = searchParams.get("sort") || "default";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice =
    Number(searchParams.get("maxPrice")) || Number.MAX_SAFE_INTEGER;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 20),
  );

  const categorySlugs = categoryParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const brandSlugs = brandParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let filtered = mockModels.filter((m) => m.isActive);

  if (q) {
    filtered = filtered.filter(
      (m) =>
        normalizeText(m.name).includes(q) ||
        normalizeText(m.brand.name).includes(q),
    );
  }

  if (categorySlugs.length > 0) {
    filtered = filtered.filter(
      (m) =>
        categorySlugs.includes(m.category.slug) ||
        categorySlugs.includes(m.parentCategorySlug),
    );
  }

  if (brandSlugs.length > 0) {
    filtered = filtered.filter((m) => brandSlugs.includes(m.brand.slug));
  }

  if (kind) filtered = filtered.filter((m) => m.kind === kind);
  if (cameraType)
    filtered = filtered.filter((m) => m.cameraType === cameraType);
  if (mount) filtered = filtered.filter((m) => m.mount === mount);
  if (branch) {
    filtered = filtered.filter((m) => m.availableAtBranches.includes(branch));
  }
  if (featured === "true") filtered = filtered.filter((m) => m.isFeatured);
  if (excludeId) filtered = filtered.filter((m) => m.id !== excludeId);

  filtered = filtered.filter(
    (m) => m.pricePerDay >= minPrice && m.pricePerDay <= maxPrice,
  );

  if (sort === "price_asc") {
    filtered = [...filtered].sort((a, b) => a.pricePerDay - b.pricePerDay);
  } else if (sort === "price_desc") {
    filtered = [...filtered].sort((a, b) => b.pricePerDay - a.pricePerDay);
  } else if (sort === "newest") {
    filtered = [...filtered].reverse();
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map(toListItem);

  return {
    items,
    page,
    pageSize,
    total,
    facets: {
      price: [
        {
          key: "lt500k",
          min: 0,
          max: 500000,
          count: mockModels.filter((m) => m.pricePerDay < 500000).length,
        },
        {
          key: "500k-900k",
          min: 500000,
          max: 900000,
          count: mockModels.filter(
            (m) => m.pricePerDay >= 500000 && m.pricePerDay <= 900000,
          ).length,
        },
        {
          key: "gte900k",
          min: 900000,
          max: null,
          count: mockModels.filter((m) => m.pricePerDay > 900000).length,
        },
      ],
      categories: mockCategories.map((c) => ({
        slug: c.slug,
        name: c.name,
        parentSlug: null,
        count: mockModels.filter((m) => m.parentCategorySlug === c.slug).length,
      })),
      brands: mockBrands.map((b) => ({
        slug: b.slug,
        name: b.name,
        count: mockModels.filter((m) => m.brand.slug === b.slug).length,
      })),
    },
  };
}

function buildQuote(body) {
  const {
    branchSlug,
    startDate,
    endDate,
    items = [],
    addons = [],
  } = body || {};

  const startMs = parseIsoUtcMs(startDate);
  const endMs = parseIsoUtcMs(endDate);
  if (startMs === null || endMs === null || endMs <= startMs) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Ngày trả máy phải sau ngày nhận máy.",
      details: { fields: { endDate: "Ngày trả phải sau ngày nhận" } },
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Vui lòng chọn ít nhất một thiết bị.",
      details: {},
    });
  }

  const days = Math.max(1, Math.round((endMs - startMs) / 86400000));
  const resolvedModels = items.map((entry) => {
    const model = mockModels.find(
      (m) => m.id === entry.modelId || m.slug === entry.modelId,
    );
    if (!model || !model.isActive) {
      throw new ApiError({
        status: 422,
        code: "MODEL_NOT_BOOKABLE",
        message: "Mẫu máy hiện không khả dụng để cho thuê.",
        details: {},
      });
    }
    return model;
  });

  const camerasInOrder = resolvedModels.filter((m) => m.kind === "CAMERA");
  const lensesInOrder = resolvedModels.filter((m) => m.kind === "LENS");
  if (camerasInOrder.length === 0) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Đơn thuê cần có ít nhất một thân máy ảnh.",
      details: {},
    });
  }

  const incompatible = lensesInOrder.some(
    (lens) => !camerasInOrder.some((cam) => cam.mount === lens.mount),
  );
  if (incompatible) {
    throw new ApiError({
      status: 422,
      code: "INCOMPATIBLE_ITEMS",
      message: "Ống kính không cùng ngàm với thân máy trong đơn.",
      details: {},
    });
  }

  const unavailableModelIds = resolvedModels
    .filter((m) => branchSlug && !m.availableAtBranches.includes(branchSlug))
    .map((m) => m.id);

  const lines = resolvedModels.map((model) => ({
    modelId: model.id,
    name: model.name,
    pricePerDay: model.pricePerDay,
    rentalAmount: computeModelRental(model, days),
    depositAmount: model.deposit,
  }));

  const resolvedAddons = (addons || [])
    .filter((a) => Number(a.quantity) > 0)
    .map((addon) => {
      const film = mockFilmProducts.find((f) => f.id === addon.filmProductId);
      const quantity = Number(addon.quantity);
      const unitPrice = film ? film.price : 0;
      return {
        filmProductId: addon.filmProductId,
        name: film ? film.name : "Film",
        quantity,
        unitPrice,
        amount: unitPrice * quantity,
      };
    });

  const rentalAmount = lines.reduce((sum, l) => sum + l.rentalAmount, 0);
  const addonsAmount = resolvedAddons.reduce((sum, a) => sum + a.amount, 0);
  const depositAmount = lines.reduce((sum, l) => sum + l.depositAmount, 0);

  return {
    days,
    available: unavailableModelIds.length === 0,
    unavailableModelIds,
    lines,
    addons: resolvedAddons,
    rentalAmount,
    addonsAmount,
    depositAmount,
    totalDueAtPickup: rentalAmount + addonsAmount + depositAmount,
  };
}

const mockUser = {
  id: "user_demo",
  fullName: "Bảo Nguyên",
  email: "bao.nguyen@borroll.vn",
  phone: "0912345678",
  avatarUrl: null,
  roles: ["RENTER"],
};

let currentUser = { ...mockUser };

function normalizePhone(value) {
  return (value || "").replace(/\s+/g, "").trim();
}

function buildMeResponse() {
  return { ...currentUser, avatarUrl: currentUser.avatarUrl || null };
}

export function handleMockRequest(normalizedPath, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const [pathname, rawQuery = ""] = normalizedPath.split("?");
  const searchParams = new URLSearchParams(rawQuery);
  const body =
    typeof options.body === "string" ? JSON.parse(options.body) : options.body;

  // Real Backend handles /health, /auth/*, /me*
  if (
    pathname === "/health" ||
    pathname.startsWith("/auth/") ||
    pathname === "/me" ||
    pathname.startsWith("/me/")
  ) {
    if (pathname === "/auth/login" && method === "POST") {
      return {
        handled: true,
        data: {
          accessToken: "mock-access-token",
          user: buildMeResponse(),
        },
      };
    }

    if (pathname === "/auth/register" && method === "POST") {
      currentUser = {
        ...currentUser,
        fullName: body?.fullName || currentUser.fullName,
        email: body?.email || currentUser.email,
        phone: body?.phone || currentUser.phone,
      };
      return {
        handled: true,
        data: {
          accessToken: "mock-access-token",
          user: buildMeResponse(),
        },
      };
    }

    if (pathname === "/auth/refresh" && method === "POST") {
      return {
        handled: true,
        data: { accessToken: "mock-access-token" },
      };
    }

    if (pathname === "/auth/logout" && method === "POST") {
      return { handled: true, data: null };
    }

    if (pathname === "/me" && method === "GET") {
      return { handled: true, data: buildMeResponse() };
    }

    if (pathname === "/me" && method === "PATCH") {
      const nextFullName =
        typeof body?.fullName === "string"
          ? body.fullName.trim()
          : currentUser.fullName;
      const nextPhone =
        typeof body?.phone === "string"
          ? normalizePhone(body.phone)
          : currentUser.phone;

      if (!nextFullName) {
        throw new ApiError({
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Họ và tên không được để trống.",
          details: { fields: { fullName: "Họ và tên không được để trống" } },
        });
      }

      if (nextPhone && !/^0\d{9}$/.test(nextPhone)) {
        throw new ApiError({
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Số điện thoại không hợp lệ.",
          details: {
            fields: {
              phone: "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0",
            },
          },
        });
      }

      currentUser = {
        ...currentUser,
        fullName: nextFullName,
        phone: nextPhone,
        avatarUrl:
          body && Object.prototype.hasOwnProperty.call(body, "avatarPath")
            ? body.avatarPath
              ? `https://images.example.com/${body.avatarPath}`
              : null
            : currentUser.avatarUrl,
      };

      return { handled: true, data: buildMeResponse() };
    }

    if (pathname === "/me/avatar/presign" && method === "POST") {
      const contentType = body?.contentType || "image/jpeg";
      return {
        handled: true,
        data: {
          uploadUrl: `https://example.com/upload?type=${encodeURIComponent(contentType)}`,
          path: `avatars/${currentUser.id}/${Date.now()}.jpg`,
          token: "mock-upload-token",
        },
      };
    }
  }

  if (
    pathname === "/health" ||
    pathname.startsWith("/auth/") ||
    pathname === "/me" ||
    pathname.startsWith("/me/")
  ) {
    return null;
  }

  if (method === "GET" && pathname === "/branches") {
    return { handled: true, data: { items: mockBranches } };
  }

  if (method === "GET" && pathname === "/categories") {
    return { handled: true, data: { items: mockCategories } };
  }

  if (method === "GET" && pathname === "/brands") {
    return { handled: true, data: { items: mockBrands } };
  }

  if (method === "GET" && pathname === "/film-products") {
    return { handled: true, data: { items: mockFilmProducts } };
  }

  if (method === "GET" && pathname === "/models") {
    return { handled: true, data: handleGetModels(searchParams) };
  }

  const availabilityMatch = pathname.match(/^\/models\/([^/]+)\/availability$/);
  if (method === "GET" && availabilityMatch) {
    const branch = searchParams.get("branch") || "tay-ho";
    const month = searchParams.get("month") || "2026-12";
    return {
      handled: true,
      data: { month, branch, unavailableDates: [] },
    };
  }

  const modelDetailMatch = pathname.match(/^\/models\/([^/]+)$/);
  if (method === "GET" && modelDetailMatch) {
    const slugOrId = decodeURIComponent(modelDetailMatch[1]);
    const model = mockModels.find(
      (m) => (m.slug === slugOrId || m.id === slugOrId) && m.isActive,
    );
    if (!model) {
      throw new ApiError({
        status: 404,
        code: "NOT_FOUND",
        message: "Không tìm thấy mẫu máy.",
      });
    }
    return {
      handled: true,
      data: {
        ...model,
        isFavorite: favoriteModelIds.has(model.id),
      },
    };
  }

  if (method === "POST" && pathname === "/bookings/quote") {
    return { handled: true, data: buildQuote(body) };
  }

  if (method === "POST" && pathname === "/bookings") {
    const quote = buildQuote(body);
    if (!quote.available) {
      throw new ApiError({
        status: 409,
        code: "NO_UNIT_AVAILABLE",
        message: "Hết máy trong khoảng ngày ở chi nhánh đã chọn.",
      });
    }
    const branch =
      mockBranches.find((b) => b.slug === body.branchSlug) || mockBranches[0];
    const nowIso = new Date().toISOString();
    const booking = {
      id: `bk_${Date.now()}`,
      code: `BR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      status: "PENDING",
      isOverdue: false,
      branch,
      startDate: body.startDate,
      endDate: body.endDate,
      days: quote.days,
      items: quote.lines.map((line) => {
        const m = mockModels.find((item) => item.id === line.modelId);
        return {
          modelId: line.modelId,
          name: line.name,
          kind: m?.kind || "CAMERA",
          thumbnailUrl: m?.thumbnailUrl || null,
          pricePerDay: line.pricePerDay,
          rentalAmount: line.rentalAmount,
          depositAmount: line.depositAmount,
        };
      }),
      addons: quote.addons.map(({ name, quantity, unitPrice, amount }) => ({
        name,
        quantity,
        unitPrice,
        amount,
      })),
      rentalAmount: quote.rentalAmount,
      addonsAmount: quote.addonsAmount,
      depositAmount: quote.depositAmount,
      totalDueAtPickup: quote.totalDueAtPickup,
      contactName: body.contactName || "",
      contactPhone: body.contactPhone || "",
      note: body.note || null,
      createdAt: nowIso,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      confirmedAt: null,
      pickedUpAt: null,
      returnedAt: null,
      completedAt: null,
      rejectedReason: null,
      cancelledReason: null,
      payments: [],
      handovers: [],
      setupPlan: null,
      viewerRole: "CUSTOMER",
      allowedActions: ["cancel"],
    };
    bookingsStore.unshift(booking);
    return { handled: true, data: booking };
  }

  if (method === "GET" && pathname === "/bookings") {
    const status = searchParams.get("status");
    const items = (
      status ? bookingsStore.filter((b) => b.status === status) : bookingsStore
    ).map((b) => {
      const rest = { ...b };
      delete rest.payments;
      delete rest.handovers;
      delete rest.setupPlan;
      return rest;
    });
    return {
      handled: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
    };
  }

  const bookingDetailMatch = pathname.match(/^\/bookings\/([^/]+)$/);
  if (method === "GET" && bookingDetailMatch) {
    const id = decodeURIComponent(bookingDetailMatch[1]);
    const booking = bookingsStore.find((b) => b.id === id);
    if (!booking) {
      throw new ApiError({
        status: 404,
        code: "NOT_FOUND",
        message: "Không tìm thấy đơn thuê.",
      });
    }
    return { handled: true, data: booking };
  }

  const bookingCancelMatch = pathname.match(/^\/bookings\/([^/]+)\/cancel$/);
  if (method === "POST" && bookingCancelMatch) {
    const id = decodeURIComponent(bookingCancelMatch[1]);
    const booking = bookingsStore.find((b) => b.id === id);
    if (!booking) {
      throw new ApiError({
        status: 404,
        code: "NOT_FOUND",
        message: "Không tìm thấy đơn thuê.",
      });
    }
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      throw new ApiError({
        status: 409,
        code: "INVALID_STATUS_TRANSITION",
        message: "Không thể hủy đơn ở trạng thái hiện tại.",
      });
    }
    booking.status = "CANCELLED";
    booking.cancelledReason = body?.reason || null;
    booking.allowedActions = [];
    return { handled: true, data: booking };
  }

  if (method === "GET" && pathname === "/favorites") {
    const items = mockModels
      .filter((m) => favoriteModelIds.has(m.id))
      .map(toListItem);
    return {
      handled: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
    };
  }

  const favoriteMatch = pathname.match(/^\/favorites\/([^/]+)$/);
  if (favoriteMatch && (method === "POST" || method === "DELETE")) {
    const modelId = decodeURIComponent(favoriteMatch[1]);
    if (method === "POST") favoriteModelIds.add(modelId);
    if (method === "DELETE") favoriteModelIds.delete(modelId);
    return { handled: true, data: null };
  }

  return null;
}
