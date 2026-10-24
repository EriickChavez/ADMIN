import { CalendarDays, Globe, Link2 } from "lucide-react";
import { API_URL } from "../../../api/client";
import { Card } from "../../../shared/components/ui/Card";
import { formatDate } from "../../../shared/utils/dates";
import type { TournamentBranding, TournamentFormValues } from "../types";

interface TournamentPreviewProps {
  values: TournamentFormValues;
  branding: TournamentBranding | null;
}

const assetUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;

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
        className="h-28"
        style={{ backgroundImage: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
      >
        {branding?.bannerUrl && (
          <img
            src={assetUrl(branding.bannerUrl)}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-blue-600 text-lg font-bold text-white shadow-sm">
          {branding?.logoUrl ? (
            <img
              src={assetUrl(branding.logoUrl)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : name ? (
            getInitials(name)
          ) : (
            "?"
          )}
        </div>

        <h3
          className={`mt-3 truncate text-lg font-semibold ${
            name ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {name || "Nombre de tu torneo"}
        </h3>
        {subtitle && (
          <p className="truncate text-sm text-slate-500">{subtitle}</p>
        )}

        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Link2 size={13} className="shrink-0" />
          <span className="truncate">{values.slug || "identificador"}</span>
        </p>

        {description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        )}

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
