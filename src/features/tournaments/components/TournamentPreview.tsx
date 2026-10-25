import { CalendarDays, Globe, Link2 } from "lucide-react";
import { resolveBrandingAsset } from "../../../shared/utils/branding-assets";
import { Card } from "../../../shared/components/ui/Card";
import { formatDate } from "../../../shared/utils/dates";
import type { TournamentBranding, TournamentFormValues } from "../types";

interface TournamentPreviewProps {
  values: TournamentFormValues;
  branding: TournamentBranding | null;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const dateRange = (start: string, end: string) => {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `Desde ${formatDate(start)}`;
  if (end) return `Hasta ${formatDate(end)}`;
  return "Fechas por definir";
};

export function TournamentPreview({
  values,
  branding,
}: TournamentPreviewProps) {
  const name = values.name.trim();
  const subtitle = values.subtitle.trim();
  const description = values.description.trim();

  return (
    <Card className="overflow-hidden">
      <div
        className="relative z-0 h-32 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600"
        style={{ backgroundImage: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
      >
        {branding?.bannerUrl ? (
          <img
            src={resolveBrandingAsset(branding.bannerUrl) ?? undefined}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/25" />
            <div className="absolute -bottom-8 left-8 h-24 w-24 rounded-full bg-white/15" />
          </div>
        )}
      </div>

      <div className="relative z-10 px-5 pb-5">
        <div className="relative z-10 -mt-10 flex h-[4.75rem] w-[4.75rem] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-lg font-bold text-blue-700 shadow-md ring-1 ring-slate-200/50">
          {branding?.logoUrl ? (
            <img
              src={resolveBrandingAsset(branding.logoUrl) ?? undefined}
              alt=""
              className="absolute inset-0 h-full w-full bg-white object-contain p-1"
            />
          ) : name ? (
            getInitials(name)
          ) : (
            "?"
          )}
        </div>

        <h3
          className={`mt-3 truncate text-lg font-semibold tracking-tight ${
            name ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {name || "Nombre de tu torneo"}
        </h3>
        {subtitle ? (
          <p className="truncate text-sm text-slate-500">{subtitle}</p>
        ) : null}

        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Link2 size={13} className="shrink-0" />
          <span className="truncate">{values.slug || "identificador"}</span>
        </p>

        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        ) : null}

        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-slate-400" />
            <span className="min-w-0 truncate">
              {dateRange(values.startDate, values.endDate)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Globe size={16} className="shrink-0 text-slate-400" />
            <span className="min-w-0 truncate">{values.timezone}</span>
          </li>
        </ul>
      </div>
    </Card>
  );
}
