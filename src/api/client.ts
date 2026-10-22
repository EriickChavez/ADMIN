import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "./types";

export const API_URL = import.meta.env.VITE_API_URL as string;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: unknown[] = []
  ) {
    super(message);
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
