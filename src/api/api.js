import { toast } from "sonner";
import axiosClient from "./axiosClient";
// -----------------------------
// error normalization
// -----------------------------
function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Request failed"
  );
}

// -----------------------------
// request wrapper
// -----------------------------
async function request(promise, config = {}) {
  const silent = config?.meta?.silent;
  const successMessage = config?.meta?.successMessage;

  try {
    const response = await promise;

    if (!silent && successMessage) {
      toast.success(successMessage);
    }

    return response.data;
  } catch (error) {
    if (!silent) {
      toast.error(getErrorMessage(error));
    }

    throw error;
  }
}

// -----------------------------
// API METHODS
// -----------------------------
export const api = {
  get: (url, config) =>
    request(axiosClient.get(url, config), config),

  post: (url, data, config) =>
    request(axiosClient.post(url, data, config), config),

  put: (url, data, config) =>
    request(axiosClient.put(url, data, config), config),

  patch: (url, data, config) =>
    request(axiosClient.patch(url, data, config), config),

  delete: (url, config) =>
    request(axiosClient.delete(url, config), config),
};