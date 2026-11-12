import { handleMockRequest } from "../mocks/mockApiRouter";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(
  /\/+$/,
  "",
);
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

let accessToken = null;
let refreshPromise = null;
let onAuthExpiredHandler = null;

export class ApiError extends Error {
  constructor({ status, code, message, details = {} }) {
    super(message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    this.name = "ApiError";
    this.status = status;
    this.code = code || "UNKNOWN_ERROR";
    this.details = details;
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

export function setAuthExpiredHandler(handler) {
  onAuthExpiredHandler = typeof handler === "function" ? handler : null;
}

async function parseJsonSafe(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toApiError(status, payload) {
  const err = payload?.error;
  return new ApiError({
    status,
    code: err?.code || `HTTP_${status}`,
    message:
      err?.message ||
      (status >= 500
        ? "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."
        : "Yêu cầu không thành công."),
    details: err?.details || {},
  });
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await parseJsonSafe(response);
      if (!response.ok || !payload?.accessToken) {
        setAccessToken(null);
        throw toApiError(response.status, payload);
      }

      setAccessToken(payload.accessToken);
      return payload.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers = {}, skipAuthRetry = false } = options;

  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (USE_MOCK) {
    const mockResult = handleMockRequest(normalizedPath, options);
    if (mockResult?.handled) {
      return mockResult.data;
    }
  }

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
    credentials: "include",
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const apiError = toApiError(response.status, payload);

    if (
      response.status === 401 &&
      apiError.code === "TOKEN_EXPIRED" &&
      !skipAuthRetry &&
      normalizedPath !== "/auth/refresh"
    ) {
      try {
        await refreshAccessToken();
        return apiRequest(normalizedPath, {
          ...options,
          skipAuthRetry: true,
        });
      } catch (refreshErr) {
        if (onAuthExpiredHandler) {
          onAuthExpiredHandler();
        }
        throw refreshErr;
      }
    }

    throw apiError;
  }

  return payload;
}

export async function uploadFileToPresignedUrl(uploadUrl, file) {
  if (USE_MOCK) {
    return;
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: "UPLOAD_FAILED",
      message: "Tải tệp tin lên máy chủ lưu trữ thất bại.",
    });
  }
}
