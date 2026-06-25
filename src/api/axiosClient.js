import axios from "axios";
import { getToken } from "@/utils/tokenUtils";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let interceptorsAttached = false;

export function setAuthInterceptors(refreshTokenFn, logoutFn) {
  if (interceptorsAttached) return;
  interceptorsAttached = true;

  // REQUEST: attach token
  axiosClient.interceptors.request.use((config) => {
    const token = getToken();
    console.log("is there a token in the interceptor here ??" , token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // RESPONSE: handle refresh only
  axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      const status = error?.response?.status;

      if (status === 401 && !original?._retry) {
        original._retry = true;

        try {
          const newToken = await refreshTokenFn();
          original.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(original);
        } catch (e) {
          logoutFn();
          return Promise.reject(e);
        }
      }

      return Promise.reject(error);
    }
  );
}

export default axiosClient;