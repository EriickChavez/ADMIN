import { api } from "../../../api/client";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "../types";

export const authService = {
  register: async (data: RegisterRequest): Promise<User> =>
    (await api.post<AuthResponse>("/auth/register", data)).data.user,

  login: async (data: LoginRequest): Promise<User> =>
    (await api.post<AuthResponse>("/auth/login", data)).data.user,

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  logoutAll: async (): Promise<void> => {
    await api.post("/auth/logout-all");
  },

  me: async (): Promise<User> =>
    (await api.get<AuthResponse>("/auth/me")).data.user,
};
