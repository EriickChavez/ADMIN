import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { ApiError } from "../../../api/client";
import type {
  Tournament,
  TournamentFormValues,
  TournamentInput,
} from "../types";

interface TournamentFormProps {
  initial?: Tournament | null;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: TournamentInput) => Promise<void>;
  onValuesChange?: (values: TournamentFormValues) => void;
}

type Values = TournamentFormValues;

type Errors = Partial<Record<keyof Values, string>>;

const SERVER_FIELDS: (keyof Values)[] = [
  "name",
  "subtitle",
  "description",
  "startDate",
  "endDate",
  "timezone",
];

// Solo para mostrar el identificador que generará la API (el slug real lo decide ella).
const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function getTimezones(current: string): string[] {
  const intl = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[];
  };
  const all = intl.supportedValuesOf?.("timeZone") ?? [];
  return Array.from(new Set(["UTC", current, ...all])).sort();
}

function validate(values: Values): Errors {
  const errors: Errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "El nombre es obligatorio";
  else if (name.length > 200) errors.name = "Máximo 200 caracteres";
  if (values.subtitle.length > 255) errors.subtitle = "Máximo 255 caracteres";
  if (values.description.length > 2000) {
    errors.description = "Máximo 2000 caracteres";
  }
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "La fecha de fin no puede ser anterior al inicio";
  }
  return errors;
}

const inputClass = (hasError: boolean) =>
  `w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
  }`;

function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
        {optional && (
          <span className="ml-1 font-normal text-slate-400">(opcional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        hint && (
          <p className="mt-1.5 break-words text-xs text-slate-500">{hint}</p>
        )
      )}
    </div>
  );
}

export function TournamentForm({
  initial,
  submitLabel,
  submittingLabel,
  onSubmit,
  onValuesChange,
}: TournamentFormProps) {
  const isEdit = !!initial;

  const [values, setValues] = useState<Values>(() => ({
    name: initial?.name ?? "",
    subtitle: initial?.subtitle ?? "",
    description: initial?.description ?? "",
    slug: initial?.slug ?? "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    timezone:
      initial?.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone ??
      "UTC",
  }));
  const [timezones] = useState(() => getTimezones(values.timezone));
  const [touched, setTouched] = useState<
    Partial<Record<keyof Values, boolean>>
  >({});
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  const clientErrors = validate(values);
  const visibleError = (field: keyof Values) =>
    serverErrors[field] ?? (touched[field] ? clientErrors[field] : undefined);

  // Cambiar el nombre de un torneo existente regenera su identificador público.
  const nameChanged = isEdit && values.name.trim() !== initial.name;

  function setField(field: keyof Values, value: string) {
    setSaved(false);
    setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name") {
        next.slug =
          initial && value.trim() === initial.name
            ? initial.slug
            : slugify(value);
      }
      return next;
    });
  }

  const blur = (field: keyof Values) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({
      name: true,
      subtitle: true,
      description: true,
      endDate: true,
    });
    setFormError(null);
    setSaved(false);
    if (Object.keys(clientErrors).length > 0) return;

    // Igual que el viejo: los vacíos se omiten y, al editar, el nombre solo se
    // manda si cambió (cambiarlo regenera el slug y podría chocar con otro torneo).
    const name = values.name.trim();
    const payload: TournamentInput = {
      ...(!initial || name !== initial.name ? { name } : {}),
      ...(values.subtitle.trim() ? { subtitle: values.subtitle.trim() } : {}),
      ...(values.description.trim()
        ? { description: values.description.trim() }
        : {}),
      ...(values.startDate ? { startDate: values.startDate } : {}),
      ...(values.endDate ? { endDate: values.endDate } : {}),
      ...(values.timezone ? { timezone: values.timezone } : {}),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      if (isEdit) setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "SLUG_ALREADY_IN_USE") {
        setServerErrors({
          name: "Ya existe un torneo con un nombre muy similar, prueba con otro nombre",
        });
      } else if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        // La API devuelve [{ path, message }]: se marca cada campo que reconozcamos.
        const details = (err.details ?? []) as {
          path?: string;
          message?: string;
        }[];
        const mapped: Errors = {};
        for (const detail of details) {
          const field = SERVER_FIELDS.find((f) => f === detail.path);
          if (field && detail.message) mapped[field] = detail.message;
        }
        if (Object.keys(mapped).length > 0) setServerErrors(mapped);
        else setFormError(err.message);
      } else {
        setFormError(
          err instanceof ApiError ? err.message : "Error inesperado",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const slugHint = !isEdit
    ? values.slug
      ? `Identificador público: ${values.slug} (se genera automáticamente)`
      : "El identificador público se genera automáticamente a partir del nombre."
    : nameChanged
      ? `Al cambiar el nombre, el identificador público pasará a ser: ${values.slug}`
      : `Identificador público: ${initial.slug}`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <Field
        label="Nombre"
        htmlFor="name"
        error={visibleError("name")}
        hint={slugHint}
      >
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={blur("name")}
          placeholder="Copa Laguna 2026"
          aria-invalid={!!visibleError("name")}
          className={inputClass(!!visibleError("name"))}
        />
      </Field>

      <Field
        label="Subtítulo"
        htmlFor="subtitle"
        optional
        error={visibleError("subtitle")}
      >
        <input
          id="subtitle"
          type="text"
          value={values.subtitle}
          onChange={(e) => setField("subtitle", e.target.value)}
          onBlur={blur("subtitle")}
          className={inputClass(!!visibleError("subtitle"))}
        />
      </Field>

      <Field
        label="Descripción"
        htmlFor="description"
        optional
        error={visibleError("description")}
      >
        <textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          onBlur={blur("description")}
          className={inputClass(!!visibleError("description"))}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Fecha de inicio" htmlFor="startDate" optional>
          <input
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
            className={inputClass(false)}
          />
        </Field>
        <Field
          label="Fecha de fin"
          htmlFor="endDate"
          optional
          error={visibleError("endDate")}
        >
          <input
            id="endDate"
            type="date"
            value={values.endDate}
            min={values.startDate || undefined}
            onChange={(e) => setField("endDate", e.target.value)}
            onBlur={blur("endDate")}
            aria-invalid={!!visibleError("endDate")}
            className={inputClass(!!visibleError("endDate"))}
          />
        </Field>
      </div>

      <Field label="Zona horaria" htmlFor="timezone">
        <select
          id="timezone"
          value={values.timezone}
          onChange={(e) => setField("timezone", e.target.value)}
          className={inputClass(false)}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </Field>

      {formError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check size={16} /> Cambios guardados
          </span>
        )}
      </div>
    </form>
  );
}
