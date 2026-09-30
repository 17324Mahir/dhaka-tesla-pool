import axios from "axios";
import { clearSession, getStoredToken } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  timeout: 75_000,
  headers: {
    "Content-Type": "application/json",
  },
});

let warmupPromise: Promise<void> | null = null;

export function warmApi(): Promise<void> {
  if (!warmupPromise) {
    warmupPromise = api
      .get("/health/ready")
      .then(() => undefined)
      .catch((error: unknown) => {
        warmupPromise = null;
        throw error;
      });
  }

  return warmupPromise;
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      typeof window !== "undefined"
    ) {
      clearSession();
      window.location.replace("/login");
    }

    return Promise.reject(error);
  },
);

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "The server is taking longer than expected to respond. Please try again.";
    }

    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    if (!error.response) {
      return "Cannot reach the API. Make sure the backend is running.";
    }
  }

  return fallback;
}

export default api;
