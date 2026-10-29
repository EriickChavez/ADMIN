import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { authService } from "./services/auth";
import type { LoginRequest, RegisterRequest, User } from "./types";

const ME_KEY = ["auth", "me"];

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data: user = null, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authService.me();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const setUser = (u: User) => qc.setQueryData(ME_KEY, u);

  const clearSession = () => {
    qc.clear();
    qc.setQueryData(ME_KEY, null);
  };

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: setUser,
  });
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: setUser,
  });
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: clearSession,
  });
  const logoutAllMutation = useMutation({
    mutationFn: authService.logoutAll,
    onSuccess: clearSession,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        logoutAll: logoutAllMutation.mutateAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
