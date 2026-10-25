import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ImageIcon,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { ApiError } from "../../../api/client";
import { resolveBrandingAsset } from "../../../shared/utils/branding-assets";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { TournamentPreview } from "../components/TournamentPreview";
import { useMyTournament, useUpdateBranding } from "../hooks";
import type { TournamentBranding, TournamentFormValues } from "../types";

const LOGO_MAX = 2 * 1024 * 1024;
const BANNER_MAX = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

type Slot = "logo" | "banner";

function validateFile(file: File, slot: Slot): string | null {
  if (!ALLOWED.includes(file.type)) {
    return "Solo se permiten PNG, JPEG o WebP";
  }
  const max = slot === "logo" ? LOGO_MAX : BANNER_MAX;
  if (file.size > max) {
    return slot === "logo"
      ? "El logo no puede superar 2 MB"
      : "El banner no puede superar 5 MB";
  }
  return null;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface DropZoneProps {
  slot: Slot;
  label: string;
  hint: string;
  currentUrl: string | null;
  pendingFile: File | null;
  onSelect: (file: File | null) => void;
  error: string | null;
  className?: string;
  imageClassName?: string;
}

function DropZone({
  slot,
  label,
  hint,
  currentUrl,
  pendingFile,
  onSelect,
  error,
  className = "",
  imageClassName = "object-cover",
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const previewUrl = objectUrl ?? resolveBrandingAsset(currentUrl);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    onSelect(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        </div>
        {pendingFile && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
            Quitar
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`group relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${className} ${
          error
            ? "border-red-300 bg-red-50/40"
            : dragging
              ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100"
              : previewUrl
                ? "border-slate-200 bg-slate-50 hover:border-blue-300"
                : "border-slate-200 bg-slate-50/80 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt=""
              className={`h-full w-full ${imageClassName}`}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/45">
              <span className="flex translate-y-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 opacity-0 shadow-md transition group-hover:translate-y-0 group-hover:opacity-100">
                <ImagePlus size={14} />
                Cambiar
              </span>
            </div>
            {pendingFile && (
              <span className="absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Nuevo
              </span>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2.5 px-4 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/80">
              <Upload size={20} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Arrastra una imagen o haz clic
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {slot === "logo"
                  ? "Cuadrada, fondo transparente ideal"
                  : "Horizontal, 3:1 recomendado"}
              </p>
            </div>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {pendingFile && !error && (
        <p className="mt-1.5 truncate text-xs text-slate-500">
          {pendingFile.name} · {formatBytes(pendingFile.size)}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

export function BrandingPage() {
  const { tournament, isLoading } = useMyTournament();
  const updateBranding = useUpdateBranding(tournament?.id ?? "");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [localLogo, setLocalLogo] = useState<string | null>(null);
  const [localBanner, setLocalBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLocalLogo(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLocalLogo(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!bannerFile) {
      setLocalBanner(null);
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setLocalBanner(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const selectLogo = useCallback((file: File | null) => {
    setSuccess(false);
    setFormError(null);
    if (!file) {
      setLogoFile(null);
      setLogoError(null);
      return;
    }
    const err = validateFile(file, "logo");
    setLogoError(err);
    setLogoFile(err ? null : file);
  }, []);

  const selectBanner = useCallback((file: File | null) => {
    setSuccess(false);
    setFormError(null);
    if (!file) {
      setBannerFile(null);
      setBannerError(null);
      return;
    }
    const err = validateFile(file, "banner");
    setBannerError(err);
    setBannerFile(err ? null : file);
  }, []);

  const branding: TournamentBranding | null = tournament?.branding ?? null;

  const previewBranding: TournamentBranding | null = (() => {
    const logoUrl = localLogo ?? branding?.logoUrl ?? null;
    const bannerUrl = localBanner ?? branding?.bannerUrl ?? null;
    if (!logoUrl && !bannerUrl) return branding;
    return {
      tournamentId: tournament?.id ?? "",
      logoUrl,
      bannerUrl,
      updatedAt: branding?.updatedAt ?? new Date().toISOString(),
    };
  })();

  const formValues: TournamentFormValues = {
    name: tournament?.name ?? "",
    subtitle: tournament?.subtitle ?? "",
    description: tournament?.description ?? "",
    slug: tournament?.slug ?? "",
    startDate: tournament?.startDate ?? "",
    endDate: tournament?.endDate ?? "",
    timezone: tournament?.timezone ?? "UTC",
  };

  const hasPending = !!(logoFile || bannerFile);
  const canSubmit =
    hasPending && !logoError && !bannerError && !updateBranding.isPending;

  const onSubmit = async () => {
    if (!tournament || !canSubmit) return;
    setFormError(null);
    setSuccess(false);
    try {
      await updateBranding.mutateAsync({
        logo: logoFile,
        banner: bannerFile,
      });
      setLogoFile(null);
      setBannerFile(null);
      setSuccess(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setFormError(e.message);
      } else {
        setFormError("No se pudo guardar el branding");
      }
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="h-[28rem] animate-pulse rounded-xl bg-slate-200/70 lg:col-span-3" />
          <div className="h-80 animate-pulse rounded-xl bg-slate-200/70 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader
          title="Branding"
          description="Personaliza el logo y el banner de tu torneo."
        />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ImageIcon size={28} />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            Primero crea tu torneo
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            El branding se asocia a un torneo existente. Créalo y vuelve aquí.
          </p>
          <Link
            to="/tournament"
            className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear torneo →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Branding"
        description="Logo y banner que se verán en la página pública de tu torneo."
      />

      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Branding actualizado
            </p>
            <p className="mt-0.5 text-sm text-emerald-800">
              Los cambios ya se reflejan en la vista previa.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="space-y-6 p-5 sm:p-6">
              <div className="border-t border-slate-100 pt-6">
                <DropZone
                  slot="logo"
                  label="Logo"
                  hint="PNG, JPEG o WebP · máx. 2 MB · ideal 512×512"
                  currentUrl={branding?.logoUrl ?? null}
                  pendingFile={logoFile}
                  onSelect={selectLogo}
                  error={logoError}
                  className="mx-auto h-40 w-40 sm:mx-0 sm:h-44 sm:w-44"
                  imageClassName="bg-white object-cover p-2 rounded-2xl"
                />
              </div>

              <DropZone
                slot="banner"
                label="Banner"
                hint="PNG, JPEG o WebP · máx. 5 MB · ideal 1200×400"
                currentUrl={branding?.bannerUrl ?? null}
                pendingFile={bannerFile}
                onSelect={selectBanner}
                error={bannerError}
                className="h-40 sm:h-48"
                imageClassName="bg-white object-cover p-2 rounded-2xl"
              />
            </div>

            {formError && (
              <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
                {formError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
              <Button type="button" disabled={!canSubmit} onClick={onSubmit}>
                {updateBranding.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Guardar cambios
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500">
                {hasPending
                  ? "Hay cambios pendientes por guardar."
                  : "Selecciona logo o banner para habilitar el guardado."}
              </p>
            </div>
          </Card>
        </div>

        <aside className="order-first min-w-0 lg:order-none lg:col-span-2">
          <div className="lg:sticky lg:top-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vista previa
            </p>
            <TournamentPreview values={formValues} branding={previewBranding} />
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Así se verá la tarjeta de tu torneo. Los cambios locales aparecen
              al instante; se guardan al pulsar el botón.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
