import { APP_BRANDING } from "../../config/app-branding";
import { AppLogo } from "./AppLogo";

interface AppBrandProps {
  variant?: "default" | "login" | "sidebar";
  logoSize?: "sm" | "md" | "lg";
  className?: string;
}

export function AppBrand({
  variant = "default",
  logoSize,
  className = "",
}: AppBrandProps) {
  const resolvedLogoSize =
    logoSize ??
    (variant === "login" ? "lg" : variant === "sidebar" ? "md" : "md");

  return (
    <div
      className={`inline-flex min-w-0 items-center gap-3 ${className}`}
      aria-label={APP_BRANDING.name}
    >
      <AppLogo
        size={resolvedLogoSize}
        className={variant === "login" ? "shadow-lg shadow-blue-600/20" : ""}
      />

      {variant === "login" ? (
        <span className="login-brand-name">
          {APP_BRANDING.namePrefix}
          <span>{APP_BRANDING.nameSuffix}</span>
        </span>
      ) : (
        <span className="truncate text-base font-bold text-slate-900">
          {APP_BRANDING.name}
        </span>
      )}
    </div>
  );
}
