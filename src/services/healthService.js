import { apiRequest } from "../lib/apiClient";

export const healthService = {
  checkHealth() {
    return apiRequest("/health", { skipAuthRetry: true });
  },
};

