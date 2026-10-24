import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../../api/client";
import { Button } from "../../../shared/components/ui/Button";
import type { Category } from "../../categories";
import type { Team, TeamFormValues, TeamInput } from "../types";

interface TeamFormProps {
  initial?: Team | null;
  categories: Category[];
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: TeamInput) => Promise<void>;
  extraActions?: ReactNode;
  defaultCategoryId?: string;
}

type Errors = Partial<Record<keyof TeamFormValues, string>>;

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
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function validate(values: TeamFormValues): Errors {
  const errors: Errors = {};
  if (!values.categoryId) errors.categoryId = "Elige una categoría";
  if (!values.name.trim()) errors.name = "El nombre es obligatorio";
  // API: abbreviation es opcional, max 50
  const abbr = values.abbreviation.trim();
  if (abbr.length > 50) {
    errors.abbreviation = "Máximo 50 caracteres";
  }
  return errors;
}

export function TeamForm({
  initial,
  categories,
  submitLabel,
  submittingLabel,
  onSubmit,
  extraActions,
  defaultCategoryId,
}: TeamFormProps) {
  const [values, setValues] = useState<TeamFormValues>(() => ({
    categoryId: initial?.categoryId ?? defaultCategoryId ?? "",
    name: initial?.name ?? "",
    abbreviation: initial?.abbreviation ?? "",
  }));
  const [touched, setTouched] = useState<
    Partial<Record<keyof TeamFormValues, boolean>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = validate(values);
  const visibleError = (field: keyof TeamFormValues) =>
    touched[field] ? clientErrors[field] : undefined;

  const setField = (field: keyof TeamFormValues, value: string) => {
    setFormError(null);
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const blur = (field: keyof TeamFormValues) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ categoryId: true, name: true, abbreviation: true });
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        categoryId: values.categoryId,
        name: values.name.trim(),
        abbreviation: values.abbreviation.trim().toUpperCase() || "",
      });
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("No se pudo guardar el equipo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Categoría"
        htmlFor="team-category"
        error={visibleError("categoryId")}
      >
        <select
          id="team-category"
          value={values.categoryId}
          onChange={(e) => setField("categoryId", e.target.value)}
          onBlur={blur("categoryId")}
          className={inputClass(!!visibleError("categoryId"))}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Nombre"
        htmlFor="team-name"
        error={visibleError("name")}
        hint="Nombre oficial del equipo"
      >
        <input
          id="team-name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={blur("name")}
          className={inputClass(!!visibleError("name"))}
          placeholder="Águilas FC"
          autoComplete="off"
        />
      </Field>

      <Field
        label="Abreviatura"
        htmlFor="team-abbr"
        error={visibleError("abbreviation")}
        hint="Opcional · hasta 50 caracteres (ej. AGU)"
      >
        <input
          id="team-abbr"
          value={values.abbreviation}
          onChange={(e) =>
            setField("abbreviation", e.target.value.toUpperCase().slice(0, 50))
          }
          onBlur={blur("abbreviation")}
          className={inputClass(!!visibleError("abbreviation"))}
          placeholder="AGU"
          maxLength={50}
          autoComplete="off"
        />
      </Field>

      {formError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <Button type="submit" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
        {extraActions}
      </div>
    </form>
  );
}
