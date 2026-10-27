import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  Globe,
  Handshake,
  ImageIcon,
  Plus,
  Eye,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useMyTournament } from "../tournaments";
import { resolveBrandingAsset } from "../../shared/utils/branding-assets";
import { ButtonLink } from "../../shared/components/ui/Button";
import { Card } from "../../shared/components/ui/Card";
import { PageHeader } from "../../shared/components/ui/PageHeader";
import { useSponsors } from "../sponsors/hooks";

function resolveSponsorLogoSrc(logoUrl: string): string {
  if (!logoUrl) return "";
  if (/^(https?:|data:|blob:)/i.test(logoUrl)) return logoUrl;
  const baseUrl = (
    (import.meta.env.VITE_SPONSOR_URL as string) ||
    (import.meta.env.VITE_API_URL as string) ||
    ""
  ).replace(/\/+$/, "");
  const path = logoUrl.replace(/^\/+/, "");
  return `${baseUrl}/${path}`;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function IdentityPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { sponsors: sponsorsData, isLoading: loadingSponsors } = useSponsors(
    tournament?.id,
  );

  if (loadingTournament) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-200/70" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return <Navigate to="/tournament" replace />;
  }

  const branding = tournament.branding;
  const sponsors = sponsorsData ?? [];
  const maxSponsors = tournament.maxSponsors ?? 10;
  const activeSponsors = sponsors.filter((s) => s.isActive);
  const availableSlots = Math.max(maxSponsors - sponsors.length, 0);

  const hasLogo = Boolean(branding?.logoUrl);
  const hasBanner = Boolean(branding?.bannerUrl);

  const logoSrc = resolveBrandingAsset(branding?.logoUrl);
  const bannerSrc = resolveBrandingAsset(branding?.bannerUrl);

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <PageHeader
        title="Identidad y Marca"
        description="Gestiona la imagen gráfica, elementos visuales y las marcas patrocinadoras de tu torneo."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <ButtonLink
              to="/tournament/branding"
              variant="secondary"
              className="text-xs sm:text-sm"
            >
              <ImageIcon size={16} />
              Editar Branding
            </ButtonLink>
            <ButtonLink to="/sponsors" className="text-xs sm:text-sm">
              <Handshake size={16} />
              Gestionar Sponsors
            </ButtonLink>
          </div>
        }
      />

      {/* 2. Top Row: 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Logo KPI */}
        <Card className="flex items-center gap-4 p-5 transition-all hover:border-slate-300">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
              hasLogo
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {hasLogo && logoSrc ? (
              <img
                src={logoSrc}
                alt={tournament.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon size={22} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Logo Oficial
              </span>
              {hasLogo ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 size={12} />
                  Listo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <AlertCircle size={12} />
                  Pendiente
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
              {hasLogo ? "Escudo configurado" : "Sin logo configurado"}
            </p>
            <Link
              to="/tournament/branding"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {hasLogo ? "Cambiar escudo" : "Subir escudo"}
              <ArrowRight size={12} />
            </Link>
          </div>
        </Card>

        {/* Banner KPI */}
        <Card className="flex items-center gap-4 p-5 transition-all hover:border-slate-300">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
              hasBanner
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {hasBanner && bannerSrc ? (
              <img
                src={bannerSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Sparkles size={22} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Portada / Banner
              </span>
              {hasBanner ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 size={12} />
                  Listo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <AlertCircle size={12} />
                  Pendiente
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
              {hasBanner ? "Portada activa" : "Sin portada configurada"}
            </p>
            <Link
              to="/tournament/branding"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {hasBanner ? "Modificar banner" : "Subir banner"}
              <ArrowRight size={12} />
            </Link>
          </div>
        </Card>

        {/* Sponsors KPI */}
        <Card className="flex items-center gap-4 p-5 transition-all hover:border-slate-300">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
            <Handshake size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sponsors
              </span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                {sponsors.length}/{maxSponsors}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
              {sponsors.length === 0
                ? "Sin sponsors aún"
                : `${activeSponsors.length} activo${activeSponsors.length === 1 ? "" : "s"}`}
            </p>
            <Link
              to="/sponsors"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {sponsors.length === 0
                ? "+ Añadir sponsor"
                : "Ver todos los sponsors"}
              <ArrowRight size={12} />
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Middle Row: 2 Big Module Cards (Branding vs Sponsors) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        {/* Left Card: Branding Oficial */}
        <Card className="flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ImageIcon size={20} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Branding Oficial
                  </h2>
                  <p className="text-xs text-slate-500">
                    Escudo y banner de portada que definen la estética de tu
                    torneo.
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  hasLogo && hasBanner
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {hasLogo && hasBanner
                  ? "Completo"
                  : hasLogo || hasBanner
                    ? "Parcial"
                    : "Incompleto"}
              </span>
            </div>

            {/* Visual Mini Preview */}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div
                className="relative h-28 w-full overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700"
                style={{
                  backgroundImage: bannerSrc
                    ? `url(${bannerSrc})`
                    : "linear-gradient(135deg, #2563eb, #4f46e5)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!bannerSrc && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs">
                      <ImageIcon size={14} /> Sin banner personalizado
                    </span>
                  </div>
                )}
              </div>

              <div className="relative px-4 pb-4 pt-1">
                <div className="relative -mt-9 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white text-base font-bold text-blue-600 shadow-sm ring-1 ring-slate-200">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={tournament.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(tournament.name)}</span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {tournament.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {tournament.subtitle || "Torneo oficial"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      {hasLogo ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={13} className="text-amber-500" />
                      )}
                      Logo
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {hasBanner ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={13} className="text-amber-500" />
                      )}
                      Banner
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    hasLogo ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                <span>Logo cuadrado (mínimo 400×400 px en PNG o WebP)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    hasBanner ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                <span>Banner panorámico horizontal para redes y cabecera</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <ButtonLink
              to="/tournament/branding"
              variant="secondary"
              className="w-full justify-center"
            >
              <span>Personalizar escudo y portada</span>
              <ArrowRight size={15} className="ml-1.5" />
            </ButtonLink>
          </div>
        </Card>

        {/* Right Card: Sponsors Oficiales (Completely Redesigned!) */}
        <Card className="flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Handshake size={20} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Sponsors Oficiales
                  </h2>
                  <p className="text-xs text-slate-500">
                    Marcas aliadas, enlaces web y dossiers comerciales en PDF.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {sponsors.length} / {maxSponsors}
              </span>
            </div>

            {/* Card Body */}
            <div className="mt-5 space-y-3">
              {loadingSponsors ? (
                <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">
                    Cargando patrocinadores...
                  </p>
                </div>
              ) : sponsors.length === 0 ? (
                /* Empty state when no sponsors */
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-2">
                    <Handshake size={22} />
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    Aún no tienes sponsors registrados
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                    Agrega patrocinadores con sus logos y enlaces para
                    mostrarlos en el portal público del torneo.
                  </p>
                  <ButtonLink
                    to="/sponsors"
                    className="mt-4 text-xs py-1.5 px-3"
                  >
                    <Plus size={14} />
                    Añadir primer sponsor
                  </ButtonLink>
                </div>
              ) : (
                /* List of sleek sponsor rows */
                <>
                  <div className="space-y-2.5">
                    {sponsors.map((sponsor) => (
                      <div
                        key={sponsor.id}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Logo container */}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50/50 p-1">
                            <img
                              src={resolveSponsorLogoSrc(sponsor.logoUrl)}
                              alt={sponsor.name}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.display = "none";
                              }}
                            />
                          </div>

                          {/* Sponsor Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {sponsor.name}
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                                  sponsor.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    sponsor.isActive
                                      ? "bg-emerald-500"
                                      : "bg-slate-400"
                                  }`}
                                />
                                {sponsor.isActive ? "Activo" : "Inactivo"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {sponsor.description || "Patrocinador oficial"}
                            </p>

                            {/* Badges for Web / PDF */}
                            <div className="mt-1 flex items-center gap-2">
                              {sponsor.websiteUrl && (
                                <a
                                  href={sponsor.websiteUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-blue-600"
                                >
                                  <Globe size={11} className="text-slate-400" />
                                  Sitio web
                                  <ExternalLink
                                    size={9}
                                    className="text-slate-400"
                                  />
                                </a>
                              )}
                              {sponsor.pdfUrl && (
                                <a
                                  href={sponsor.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                                >
                                  <FileText size={11} />
                                  Dossier PDF
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link
                          to="/sponsors"
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Administrar sponsor"
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Slot to add another sponsor if quota remains */}
                  {availableSlots > 0 && (
                    <Link
                      to="/sponsors"
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600"
                    >
                      <Plus size={14} />
                      Agregar otro patrocinador ({availableSlots} cupo
                      {availableSlots > 1 ? "s" : ""} disponible
                      {availableSlots > 1 ? "s" : ""})
                    </Link>
                  )}

                  {/* Meta summary bar */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>
                      {activeSponsors.length} de {sponsors.length} activo
                      {sponsors.length === 1 ? "" : "s"}
                    </span>
                    <span>
                      {availableSlots === 0
                        ? "Límite alcanzado"
                        : `${availableSlots} cupo${availableSlots > 1 ? "s" : ""} libre${availableSlots > 1 ? "s" : ""}`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card Footer */}
          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <ButtonLink
              to="/sponsors"
              variant="secondary"
              className="w-full justify-center"
            >
              <span>Gestionar patrocinadores</span>
              <ArrowRight size={15} className="ml-1.5" />
            </ButtonLink>
          </div>
        </Card>
      </div>

      {/* 4. Bottom Card: Vista Previa de la Cabecera Pública */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Vista Previa de la Cabecera Pública
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Vista Participante
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Así se combinan tu banner, escudo y patrocinadores oficiales en la
            vista del torneo.
          </p>
        </div>

        <div className="p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header Banner */}
            <div
              className="relative h-44 w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800"
              style={{
                backgroundImage: bannerSrc
                  ? `url(${bannerSrc})`
                  : "linear-gradient(135deg, #1d4ed8, #4338ca)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute right-4 top-4 rounded-lg bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                Torneo Oficial
              </div>
            </div>

            {/* Profile Bar */}
            <div className="relative px-6 pb-6 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex items-end gap-4">
                  <div className="relative -mt-16 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-2xl font-bold text-blue-600 shadow-md ring-1 ring-slate-200">
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={tournament.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(tournament.name)}</span>
                    )}
                  </div>
                  <div className="mb-1">
                    <h3 className="text-xl font-bold text-slate-900">
                      {tournament.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {tournament.subtitle || "Edición 2026"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    <Trophy size={14} className="text-amber-500" />/
                    {tournament.slug}
                  </span>
                </div>
              </div>

              {/* Sponsors Strip in Public Header */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Patrocinadores Oficiales
                  </span>
                  <Link
                    to="/sponsors"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Administrar lista
                  </Link>
                </div>

                {activeSponsors.length === 0 ? (
                  <div className="flex items-center justify-center rounded-xl bg-slate-50 py-4 text-center">
                    <p className="text-xs text-slate-400">
                      Los logos de tus patrocinadores oficiales se exhibirán en
                      esta franja.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-4">
                    {activeSponsors.map((sponsor) => (
                      <div
                        key={sponsor.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
                        title={sponsor.description || sponsor.name}
                      >
                        <img
                          src={resolveSponsorLogoSrc(sponsor.logoUrl)}
                          alt={sponsor.name}
                          className="h-5 w-5 object-contain"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {sponsor.name}
                        </span>
                        {sponsor.websiteUrl && (
                          <ExternalLink size={10} className="text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default IdentityPage;
