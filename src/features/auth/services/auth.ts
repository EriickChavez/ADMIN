import { api, ApiError } from "../../../api/client";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "../types";

const extractUser = (data: AuthResponse | undefined): User => {
  if (!data?.user) {
    throw new ApiError(500, "INVALID_RESPONSE", "Respuesta inesperada del servidor");
  }
  return data.user;
};

export const authService = {
  register: async (data: RegisterRequest): Promise<User> =>
    extractUser((await api.post<AuthResponse>("/auth/register", data)).data),

  login: async (data: LoginRequest): Promise<User> =>
    extractUser((await api.post<AuthResponse>("/auth/login", data)).data),

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  logoutAll: async (): Promise<void> => {
    await api.post("/auth/logout-all");
  },

  me: async (): Promise<User> =>
    extractUser((await api.get<AuthResponse>("/auth/me")).data),
};