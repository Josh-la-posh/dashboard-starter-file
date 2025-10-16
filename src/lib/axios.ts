import axios, { type AxiosRequestConfig, type AxiosRequestHeaders } from "axios";
import { useAuthStore } from "../store/auth";
import { toAppError } from "./error";

// Extend AxiosRequestConfig to mark a retried request
declare module "axios" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface AxiosRequestConfig {
    __isRetry?: boolean;
  }
}

export const authApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/account/`,
});

export const api2 = axios.create({
  baseURL: import.meta.env.VITE_MERCHANT_BASE_URL,
});

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // withCredentials: true,
});

// Attach token
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple refresh logic (assumes /auth/refresh sets new access token from cookie)
let refreshing: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  const { setAccessToken, logout } = useAuthStore.getState();
  try {
    const res = await authApi.post(
      `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {},
      { withCredentials: true }
    );
    const token = res.data?.accessToken || null;
    setAccessToken(token);
    return token;
  } catch {
    logout();
    return null;
  }
}

api.interceptors.response.use(
  res => res,
  async (error) => {
    const appErr = toAppError(error);

    const config = error.config as AxiosRequestConfig | undefined;
    const status = error.response?.status;

    // Attempt refresh once on 401
    if (status === 401 && config && !config.__isRetry) {
      config.__isRetry = true;

      refreshing = refreshing ?? refreshToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        config.headers = config.headers ?? {};
        (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${newToken}`;
        return api(config); //retry original request
      }

      // refresh failed: fall through to reject AppError (UNAUTHORIZED)
      useAuthStore.getState().logout?.();
    }

    // IMPORTANT: always reject AppError so callers have a unified shape
    return Promise.reject(appErr);
  }
);

authApi.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(toAppError(error))
);
