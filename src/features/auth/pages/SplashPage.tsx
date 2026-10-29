import { useEffect, useState } from "react";
import { APP_BRANDING } from "../../../shared/config/app-branding";
import "./SplashPage.css";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth";
import { ApiError } from "../../../api/client";

interface SplashPageProps {}
const TIMEOUT_MS = 10_000;
const MIN_DISPLAY_MS = 3_000;

export function SplashPage({}: SplashPageProps) {
  const LogoIcon = APP_BRANDING.logoIcon;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startedAt = Date.now();

    function navigateAfterMinDisplay(callback: () => void) {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        if (!cancelled) callback();
      }, remaining);
    }

    async function checkSession() {
      setHasError(false);
      try {
        const data = await authService.me();
        if (cancelled) return;
        queryClient.setQueryData(["auth", "me"], data);
        navigateAfterMinDisplay(() => navigate("/home", { replace: true }));
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 401) {
          navigateAfterMinDisplay(() => navigate("/login", { replace: true }));
          return;
        }

        navigateAfterMinDisplay(() => setHasError(true));
      } finally {
        clearTimeout(timeoutId);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [attempt, navigate, queryClient]);

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-gray-50">
        <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900">Sin conexión</p>
          <p className="text-sm text-gray-500 mt-1">
            No pudimos conectar con el servidor.
          </p>
        </div>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="min-h-11 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`splash-screen "splash-fade-out"`}>
      <div className="splash-grid-bg" aria-hidden="true" />
      <div className="splash-orb" aria-hidden="true" />

      <div className="splash-content">
        <div className="splash-brand-mark">
          <LogoIcon />
        </div>

        <div className="splash-title-group">
          <span className="splash-brand-title">
            {APP_BRANDING.namePrefix}
            <span>{APP_BRANDING.nameSuffix}</span>
          </span>
          <span className="splash-subtitle">ADMINISTRATION PANEL</span>
        </div>

        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
      </div>

      <footer className="splash-footer">
        <span>
          © {new Date().getFullYear()} {APP_BRANDING.name}
        </span>
        <span>HECHO PARA COMPETIR</span>
      </footer>
    </div>
  );
}
