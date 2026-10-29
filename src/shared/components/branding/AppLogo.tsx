import { APP_BRANDING } from "../../config/app-branding";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
}

const SIZE_CLASSES: Record<NonNullable<AppLogoProps["size"]>, string> = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-11 w-11 rounded-xl",
};

const ICON_SIZES: Record<NonNullable<AppLogoProps["size"]>, number> = {
  sm: 17,
  md: 20,
  lg: 24,
};

export function AppLogo({
  size = "md",
  className = "",
  iconClassName = "",
}: AppLogoProps) {
  const Icon = APP_BRANDING.logoIcon;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-blue-600 text-white shadow-sm ${SIZE_CLASSES[size]} ${className}`}
      aria-label={`${APP_BRANDING.name} logo`}
    >
      {APP_BRANDING.logoSrc ? (
        <img
          src={APP_BRANDING.logoSrc}
          alt=""
          className="h-full w-full object-contain"
        />
      ) : (
        <Icon
          size={ICON_SIZES[size]}
          strokeWidth={2.2}
          className={iconClassName}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
