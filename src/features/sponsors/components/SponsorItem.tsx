import type { TournamentSponsor } from "../types";

const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface SponsorItemProps {
  sponsor: TournamentSponsor;
  onEdit: (sponsor: TournamentSponsor) => void;
  onDelete: (sponsor: TournamentSponsor) => void;
  isDeleting: boolean;
}

// El logo puede venir como ruta relativa (subido como archivo, servido por la
// API) o como URL absoluta (si el sponsor se creó con logoUrl externo).
function resolveLogoSrc(logoUrl: string): string {
  if (!logoUrl) return "";
  if (/^(https?:|data:|blob:)/i.test(logoUrl)) return logoUrl;
  const baseUrl = ((import.meta.env.VITE_SPONSOR_URL as string) || "").replace(
    /\/+$/,
    "",
  );
  const path = logoUrl.replace(/^\/+/, "");
  return `${baseUrl}/${path}`;
}

export function SponsorItem({
  sponsor,
  onEdit,
  onDelete,
  isDeleting,
}: SponsorItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="min-w-0 flex-1 flex items-center gap-3">
        <img
          src={resolveLogoSrc(sponsor.logoUrl)}
          alt={sponsor.name}
          className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {sponsor.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                sponsor.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {sponsor.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">
            {sponsor.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={() => onEdit(sponsor)}
          className="min-h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-1.5"
          title="Editar sponsor"
        >
          <EditIcon />
          Editar
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete(sponsor)}
          className="min-h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          title="Eliminar sponsor"
        >
          <TrashIcon />
          Eliminar
        </button>
      </div>
    </div>
  );
}
