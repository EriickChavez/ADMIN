import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../../api/client";
import { Button } from "../../../shared/components/ui/Button";
import type { Category, CategoryFormValues, CategoryInput } from "../types";

interface CategoryFormProps {
  initial?: Category | null;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: CategoryInput) => Promise<void>;
  extraActions?: ReactNode;
}

type Errors = Partial<Record<keyof CategoryFormValues, string>>;

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
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function parseAge(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function validate(values: CategoryFormValues): Errors {
  const errors: Errors = {};
  if (!values.title.trim()) errors.title = "El título es obligatorio";

  const min = parseAge(values.minAge);
  const max = parseAge(values.maxAge);

  if (values.minAge.trim() && Number.isNaN(min)) {
    errors.minAge = "Ingresa un número válido";
  } else if (min != null && (min < 0 || min > 99)) {
    errors.minAge = "Usa un valor entre 0 y 99";
  }

  if (values.maxAge.trim() && Number.isNaN(max)) {
    errors.maxAge = "Ingresa un número válido";
  } else if (max != null && (max < 0 || max > 99)) {
    errors.maxAge = "Usa un valor entre 0 y 99";
  }

  if (
    min != null &&
    max != null &&
    !Number.isNaN(min) &&
    !Number.isNaN(max) &&
    min > max
  ) {
    errors.maxAge = "La edad máxima no puede ser menor que la mínima";
  }

  return errors;
}

export function CategoryForm({
  initial,
  submitLabel,
  submittingLabel,
  onSubmit,
  extraActions,
}: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>(() => ({
    title: initial?.title ?? "",
    minAge: initial?.minAge != null ? String(initial.minAge) : "",
    maxAge: initial?.maxAge != null ? String(initial.maxAge) : "",
    description: initial?.description ?? "",
  }));
  const [touched, setTouched] = useState<
    Partial<Record<keyof CategoryFormValues, boolean>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = validate(values);
  const visibleError = (field: keyof CategoryFormValues) =>
    touched[field] ? clientErrors[field] : undefined;

  const setField = (field: keyof CategoryFormValues, value: string) => {
    setFormError(null);
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const blur = (field: keyof CategoryFormValues) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ title: true, minAge: true, maxAge: true, description: true });
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    const minAge = parseAge(values.minAge);
    const maxAge = parseAge(values.maxAge);

    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        minAge: minAge == null || Number.isNaN(minAge) ? null : minAge,
        maxAge: maxAge == null || Number.isNaN(maxAge) ? null : maxAge,
        description: values.description.trim() || null,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("No se pudo guardar la categoría");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Título"
        htmlFor="cat-title"
        error={visibleError("title")}
        hint="Ej. Sub-15, Libre, Femenil"
      >
        <input
          id="cat-title"
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          onBlur={blur("title")}
          className={inputClass(!!visibleError("title"))}
          placeholder="Sub-15"
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Edad mínima"
          htmlFor="cat-min"
          optional
          error={visibleError("minAge")}
        >
          <input
            id="cat-min"
            type="number"
            min={0}
            max={99}
            value={values.minAge}
            onChange={(e) => setField("minAge", e.target.value)}
            onBlur={blur("minAge")}
            className={inputClass(!!visibleError("minAge"))}
            placeholder="13"
          />
        </Field>
        <Field
          label="Edad máxima"
          htmlFor="cat-max"
          optional
          error={visibleError("maxAge")}
        >
          <input
            id="cat-max"
            type="number"
            min={0}
            max={99}
            value={values.maxAge}
            onChange={(e) => setField("maxAge", e.target.value)}
            onBlur={blur("maxAge")}
            className={inputClass(!!visibleError("maxAge"))}
            placeholder="15"
          />
        </Field>
      </div>

      <Field
        label="Descripción"
        htmlFor="cat-desc"
        optional
        error={visibleError("description")}
      >
        <textarea
          id="cat-desc"
          rows={3}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          onBlur={blur("description")}
          className={`${inputClass(!!visibleError("description"))} resize-y`}
          placeholder="Notas o reglas específicas de esta categoría"
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
