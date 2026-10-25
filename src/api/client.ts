import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "./types";

export const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  console.error(
    "[api] Falta VITE_API_URL. Crea un .env (copia .env.example) y reinicia `npm run dev`."
  );
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown[];

  constructor(status: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;
    return Promise.reject(
      new ApiError(
        status,
        body?.code ?? "NETWORK_ERROR",
        body?.message ?? "No se pudo conectar con el servidor",
        body?.details
      )
    );
  }
);