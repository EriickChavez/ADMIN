import { useState, type FormEvent } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import type { SponsorInput, TournamentSponsor } from "../types";

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/jpg",
];
const MAX_LOGO_SIZE_MB = 2;
const MAX_PDF_SIZE_MB = 10;

type PdfMode = "keep" | "none" | "file" | "url" | "remove";

interface SponsorFormProps {
  sponsor?: TournamentSponsor | null;
  submitting: boolean;
  error?: string | null;
  onSubmit: (input: SponsorInput) => void;
  onCancel: () => void;
}

const field =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const fileField =
  "w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-blue-700";
const modeBtn = (active: boolean, danger?: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? danger
        ? "border-red-600 bg-red-600 text-white"
        : "border-blue-600 bg-blue-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
  }`;

type Errors = Partial<
  Record<
    "name" | "description" | "websiteUrl" | "order" | "logo" | "pdf",
    string
  >
>;

export function SponsorForm({
  sponsor,
  submitting,
  error,
  onSubmit,
  onCancel,
}: SponsorFormProps) {
  const isEdit = !!sponsor;

  const [name, setName] = useState(sponsor?.name ?? "");
  const [description, setDescription] = useState(sponsor?.description ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(sponsor?.websiteUrl ?? "");
  const [order, setOrder] = useState(String(sponsor?.order ?? 0));
  const [isActive, setIsActive] = useState(sponsor?.isActive ?? true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pdfMode, setPdfMode] = useState<PdfMode>(
    sponsor?.pdfUrl ? "keep" : "none",
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrlText, setPdfUrlText] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function pickLogo(file: File | null) {
    if (!file) {
      setLogoFile(null);
      setErrors((prev) => ({ ...prev, logo: undefined }));
      return;
    }
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        logo: "Formato no permitido. Usa PNG, JPEG o WEBP.",
      }));
      return;
    }
    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo: `El archivo excede el máximo de ${MAX_LOGO_SIZE_MB}MB.`,
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, logo: undefined }));
    setLogoFile(file);
  }

  function pickPdf(file: File | null) {
    if (!file) {
      setPdfFile(null);
      setErrors((prev) => ({ ...prev, pdf: undefined }));
      return;
    }
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({
        ...prev,
        pdf: "Formato no permitido. Solo PDF.",
      }));
      return;
    }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        pdf: `El archivo excede el máximo de ${MAX_PDF_SIZE_MB}MB.`,
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, pdf: undefined }));
    setPdfFile(file);
  }

  function validate(): Errors {
    const next: Errors = {};
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedWebsite = websiteUrl.trim();

    if (!trimmedName) next.name = "El nombre es requerido";
    else if (trimmedName.length > 200) next.name = "Máximo 200 caracteres";

    if (!trimmedDescription) next.description = "La descripción es requerida";
    else if (trimmedDescription.length > 500)
      next.description = "Máximo 500 caracteres";

    if (trimmedWebsite && !/^https?:\/\/.+/.test(trimmedWebsite)) {
      next.websiteUrl = "Debe ser una URL válida (http:// o https://)";
    }
    if (order.trim() !== "" && !Number.isInteger(Number(order))) {
      next.order = "Debe ser un número entero";
    }

    // En creación el logo es obligatorio; en edición se conserva el actual.
    if (!isEdit && !logoFile) next.logo = "El logo es requerido";

    if (pdfMode === "file" && !pdfFile) next.pdf = "Selecciona un archivo PDF.";
    if (pdfMode === "url" && !pdfUrlText.trim())
      next.pdf = "Escribe la URL del PDF.";

    // Un sponsor no puede tener sitio web y PDF al mismo tiempo.
    const willHavePdf =
      pdfMode === "file" || pdfMode === "url" || pdfMode === "keep";
    if (trimmedWebsite && willHavePdf) {
      next.pdf = "No puede tener sitio web y PDF al mismo tiempo.";
    }
    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = {
      ...validate(),
      ...(errors.logo && !found_logo_ok() ? { logo: errors.logo } : {}),
    };
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const trimmedWebsite = websiteUrl.trim();
    const input: SponsorInput = {
      name: name.trim(),
      description: description.trim(),
      order: order.trim() === "" ? 0 : Number(order),
      isActive,
      logo: logoFile,
      // En edición se manda siempre (vacío = quitar el sitio web).
      ...(isEdit || trimmedWebsite ? { websiteUrl: trimmedWebsite } : {}),
    };
    if (pdfMode === "file") input.pdf = pdfFile;
    if (pdfMode === "url") input.pdfUrl = pdfUrlText.trim();
    if (pdfMode === "remove") input.removePdf = true;

    onSubmit(input);
  }

  // Un error de formato del logo (ya mostrado) no debe perderse al revalidar.
  function found_logo_ok() {
    return logoFile !== null || isEdit;
  }

  const err = (key: keyof Errors) =>
    errors[key] && <p className="mt-1.5 text-xs text-red-600">{errors[key]}</p>;

  return (
    <Card className="mb-6 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        {isEdit ? "Editar sponsor" : "Nuevo sponsor"}
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        {isEdit
          ? "Modifica los datos del sponsor."
          : "Agrega un nuevo patrocinador al torneo."}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="sp-name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="sp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Refrescos del Norte"
            className={field}
          />
          {err("name")}
        </div>

        <div>
          <label
            htmlFor="sp-description"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            id="sp-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción del sponsor"
            className={field}
          />
          {err("description")}
        </div>

        <div>
          <label
            htmlFor="sp-logo"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Logo {!isEdit && <span className="text-red-500">*</span>}
            {isEdit && (
              <span className="font-normal text-slate-400">
                (opcional, reemplaza el actual)
              </span>
            )}
          </label>
          <input
            id="sp-logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={fileField}
            onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            PNG, JPEG o WEBP, máx. {MAX_LOGO_SIZE_MB}MB.
          </p>
          {err("logo")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            PDF <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {isEdit && sponsor?.pdfUrl && (
              <button
                type="button"
                className={modeBtn(pdfMode === "keep")}
                onClick={() => setPdfMode("keep")}
              >
                Mantener actual
              </button>
            )}
            <button
              type="button"
              className={modeBtn(pdfMode === "file")}
              onClick={() => setPdfMode("file")}
            >
              Subir archivo
            </button>
            <button
              type="button"
              className={modeBtn(pdfMode === "url")}
              onClick={() => setPdfMode("url")}
            >
              URL externa
            </button>
            {isEdit && sponsor?.pdfUrl && (
              <button
                type="button"
                className={modeBtn(pdfMode === "remove", true)}
                onClick={() => setPdfMode("remove")}
              >
                Quitar PDF
              </button>
            )}
            {!isEdit && (
              <button
                type="button"
                className={modeBtn(pdfMode === "none")}
                onClick={() => setPdfMode("none")}
              >
                Sin PDF
              </button>
            )}
          </div>

          {pdfMode === "keep" && sponsor?.pdfUrl && (
            <p className="truncate text-xs text-slate-500">{sponsor.pdfUrl}</p>
          )}
          {pdfMode === "file" && (
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => pickPdf(e.target.files?.[0] ?? null)}
              className={fileField}
            />
          )}
          {pdfMode === "url" && (
            <input
              value={pdfUrlText}
              onChange={(e) => setPdfUrlText(e.target.value)}
              placeholder="https://..."
              className={field}
            />
          )}
          {pdfMode === "remove" && (
            <p className="text-xs text-red-600">
              El PDF actual se eliminará al guardar.
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            Solo PDF, máx. {MAX_PDF_SIZE_MB}MB. No puede tener sitio web y PDF
            al mismo tiempo.
          </p>
          {err("pdf")}
        </div>

        <div>
          <label
            htmlFor="sp-website"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Sitio web{" "}
            <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="sp-website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className={field}
          />
          {err("websiteUrl")}
        </div>

        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="sp-order"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Orden
            </label>
            <input
              id="sp-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
              className={field}
            />
            {err("order")}
          </div>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Sponsor activo
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Crear sponsor"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
