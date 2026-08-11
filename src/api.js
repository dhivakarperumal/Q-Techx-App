import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// export const API_BASE_URL = "https://dmart.qtechx.com/api";
export const API_BASE_URL = "http://192.168.1.10:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

const MAX_RETRIES = 1;
let cachedToken = null;

export function clearTokenCache() {
  cachedToken = null;
}

api.interceptors.request.use(async (config) => {
  if (!cachedToken) {
    cachedToken = await AsyncStorage.getItem("userToken");
  }

  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const retryCount = originalRequest?._retryCount || 0;
    const isNetworkError =
      !error.response && (error.code || error.message === "Network Error");

    if (isNetworkError && originalRequest && retryCount < MAX_RETRIES) {
      originalRequest._retryCount = retryCount + 1;
      return api(originalRequest);
    }

    if (error.response) {
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || "Server error",
        data: error.response.data,
      });
    }

    return Promise.reject({
      status: "network_error",
      message: `Network connection failed. Check that ${API_BASE_URL} is reachable.`,
    });
  },
);

export default api;
