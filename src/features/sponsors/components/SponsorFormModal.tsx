import { useState, type FormEvent } from "react";
import type { TournamentSponsor } from "../types";

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/jpg",
];
const MAX_LOGO_SIZE_MB = 2;
const ALLOWED_PDF_TYPES = ["application/pdf"];
const MAX_PDF_SIZE_MB = 10;

type PdfMode = "keep" | "none" | "file" | "url" | "remove";

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface SponsorSubmitValues {
  name: string;
  description: string;
  websiteUrl?: string;
  order: number;
  isActive: boolean;
  logo: File | null;
  pdf: File | null;
  pdfUrl?: string;
  removePdf?: boolean;
}

// El modal se monta solo cuando está abierto (ver SponsorsSection), por eso no
// recibe isOpen ni necesita un effect para resetearse: el estado inicial se
// deriva de las props y se descarta al desmontar.
interface SponsorFormModalProps {
  onClose: () => void;
  onSubmit: (values: SponsorSubmitValues) => void;
  sponsor?: TournamentSponsor | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export function SponsorFormModal({
  onClose,
  onSubmit,
  sponsor,
  isSubmitting,
  errorMessage,
}: SponsorFormModalProps) {
  const isEdit = Boolean(sponsor);
  const [name, setName] = useState(sponsor?.name ?? "");
  const [description, setDescription] = useState(sponsor?.description ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(sponsor?.websiteUrl ?? "");
  const [order, setOrder] = useState(String(sponsor?.order ?? 0));
  const [isActive, setIsActive] = useState(sponsor?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [pdfMode, setPdfMode] = useState<PdfMode>(
    sponsor?.pdfUrl ? "keep" : "none",
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrlText, setPdfUrlText] = useState("");
  const [pdfError, setPdfError] = useState<string | null>(null);

  function handleLogoChange(file: File | null) {
    if (!file) {
      setLogoFile(null);
      setLogoError(null);
      return;
    }
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Formato no permitido. Usa PNG, JPEG o WEBP.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setLogoError(`El archivo excede el máximo de ${MAX_LOGO_SIZE_MB}MB.`);
      return;
    }
    setLogoError(null);
    setLogoFile(file);
  }

  function handlePdfChange(file: File | null) {
    if (!file) {
      setPdfFile(null);
      setPdfError(null);
      return;
    }
    if (!ALLOWED_PDF_TYPES.includes(file.type)) {
      setPdfError("Formato no permitido. Solo PDF.");
      return;
    }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      setPdfError(`El archivo excede el máximo de ${MAX_PDF_SIZE_MB}MB.`);
      return;
    }
    setPdfError(null);
    setPdfFile(file);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!description.trim()) {
      newErrors.description = "La descripción es requerida";
    }
    if (websiteUrl.trim()) {
      try {
        new URL(websiteUrl.trim());
      } catch {
        newErrors.websiteUrl = "Debe ser una URL válida (ej. https://ejemplo.com)";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    // En creación el logo es obligatorio (la API exige logo o logoUrl);
    // en edición es opcional, se conserva el logo actual si no se elige uno nuevo.
    if (!isEdit && !logoFile) {
      setLogoError("El logo es requerido");
      return;
    }
    if (pdfMode === "file" && !pdfFile) {
      setPdfError("Selecciona un archivo PDF.");
      return;
    }
    if (pdfMode === "url" && !pdfUrlText.trim()) {
      setPdfError("Escribe la URL del PDF.");
      return;
    }

    // Un sponsor no puede tener sitio web y PDF al mismo tiempo.
    const trimmedWebsite = websiteUrl.trim();
    const willHavePdf =
      pdfMode === "file" || pdfMode === "url" || pdfMode === "keep";
    if (trimmedWebsite && willHavePdf) {
      setPdfError("No puede tener sitio web y PDF al mismo tiempo.");
      return;
    }

    const submitValues: SponsorSubmitValues = {
      name: name.trim(),
      description: description.trim(),
      websiteUrl: trimmedWebsite || undefined,
      order: Number(order) || 0,
      isActive,
      logo: logoFile,
      pdf: null,
    };
    if (pdfMode === "file") submitValues.pdf = pdfFile;
    if (pdfMode === "url") submitValues.pdfUrl = pdfUrlText.trim();
    if (pdfMode === "remove") submitValues.removePdf = true;

    onSubmit(submitValues);
  }

  const inputClass =
    "w-full min-h-11 px-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

  const modeBtnClass = (active: boolean, danger?: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      active
        ? danger
          ? "bg-red-600 text-white border-red-600"
          : "bg-primary text-white border-primary"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "Editar sponsor" : "Nuevo sponsor"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? "Modifica los datos del sponsor"
                : "Agrega un nuevo patrocinador al torneo"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="sp-name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="sp-name"
              placeholder="Ej. Refrescos del Norte"
              className={inputClass}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: "" }));
                }
              }}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1.5">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sp-description"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="sp-description"
              rows={3}
              placeholder="Breve descripción del sponsor"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1.5">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sp-logo"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Logo {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && (
                <span className="text-gray-400 font-normal">
                  (opcional, reemplaza el actual)
                </span>
              )}
            </label>
            <input
              id="sp-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-medium"
              onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              PNG, JPEG o WEBP, máx. {MAX_LOGO_SIZE_MB}MB.
            </p>
            {logoError && (
              <p className="text-xs text-red-500 mt-1.5">{logoError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PDF <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {isEdit && sponsor?.pdfUrl && (
                <button
                  type="button"
                  className={modeBtnClass(pdfMode === "keep")}
                  onClick={() => setPdfMode("keep")}
                >
                  Mantener actual
                </button>
              )}
              <button
                type="button"
                className={modeBtnClass(pdfMode === "file")}
                onClick={() => setPdfMode("file")}
              >
                Subir archivo
              </button>
              <button
                type="button"
                className={modeBtnClass(pdfMode === "url")}
                onClick={() => setPdfMode("url")}
              >
                URL externa
              </button>
              {isEdit && sponsor?.pdfUrl && (
                <button
                  type="button"
                  className={modeBtnClass(pdfMode === "remove", true)}
                  onClick={() => setPdfMode("remove")}
                >
                  Quitar pdf
                </button>
              )}
              {!isEdit && (
                <button
                  type="button"
                  className={modeBtnClass(pdfMode === "none")}
                  onClick={() => setPdfMode("none")}
                >
                  Sin pdf
                </button>
              )}
            </div>

            {pdfMode === "keep" && sponsor?.pdfUrl && (
              <p className="text-xs text-gray-500 truncate">{sponsor.pdfUrl}</p>
            )}
            {pdfMode === "file" && (
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handlePdfChange(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-medium"
              />
            )}
            {pdfMode === "url" && (
              <input
                value={pdfUrlText}
                onChange={(e) => setPdfUrlText(e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            )}
            {pdfMode === "remove" && (
              <p className="text-xs text-red-600">
                El pdf actual se eliminará al guardar.
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              Solo PDF, máx. {MAX_PDF_SIZE_MB}MB. No puede tener sitio web y PDF
              al mismo tiempo.
            </p>
            {pdfError && (
              <p className="text-xs text-red-500 mt-1.5">{pdfError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="sp-website"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Sitio web{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="sp-website"
              placeholder="https://..."
              className={inputClass}
              value={websiteUrl}
              onChange={(e) => {
                setWebsiteUrl(e.target.value);
                if (errors.websiteUrl) {
                  setErrors((prev) => ({ ...prev, websiteUrl: "" }));
                }
              }}
            />
            {errors.websiteUrl && (
              <p className="text-xs text-red-500 mt-1.5">
                {errors.websiteUrl}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label
                htmlFor="sp-order"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Orden
              </label>
              <input
                id="sp-order"
                type="number"
                placeholder="0"
                className={inputClass}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 min-h-11 px-1 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              Sponsor activo
            </label>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-xs text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 mt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear sponsor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
