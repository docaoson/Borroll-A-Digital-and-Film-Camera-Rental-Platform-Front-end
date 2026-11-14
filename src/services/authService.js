import {
  apiRequest,
  refreshAccessToken,
  setAccessToken,
  uploadFileToPresignedUrl,
} from "../lib/apiClient";

export const authService = {
  async register(payload) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: payload,
      skipAuthRetry: true,
    });
    setAccessToken(data.accessToken);
    return data;
  },

  async login(payload) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: payload,
      skipAuthRetry: true,
    });
    setAccessToken(data.accessToken);
    return data;
  },

  async refresh() {
    const token = await refreshAccessToken();
    return { accessToken: token };
  },

  async logout() {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        skipAuthRetry: true,
      });
    } finally {
      setAccessToken(null);
    }
  },

  getMe() {
    return apiRequest("/me");
  },

  updateMe(payload) {
    return apiRequest("/me", {
      method: "PATCH",
      body: payload,
    });
  },

  presignAvatar(contentType) {
    return apiRequest("/me/avatar/presign", {
      method: "POST",
      body: { contentType },
    });
  },

  async uploadAvatar(file) {
    const { uploadUrl, path } = await this.presignAvatar(file.type);
    await uploadFileToPresignedUrl(uploadUrl, file);
    return this.updateMe({ avatarPath: path });
  },
};
