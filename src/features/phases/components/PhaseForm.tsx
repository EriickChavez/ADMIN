import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../../api/client";
import { Button } from "../../../shared/components/ui/Button";
import type {
  Phase,
  PhaseFormValues,
  PhaseInput,
  PhaseStatus,
  PhaseType,
} from "../types";
import { PHASE_STATUS_LABELS, PHASE_TYPE_LABELS } from "../types";

interface PhaseFormProps {
  initial?: Phase | null;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: PhaseInput) => Promise<void>;
  extraActions?: ReactNode;
}

type Errors = Partial<Record<keyof PhaseFormValues, string>>;

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

function validate(values: PhaseFormValues): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "El nombre es obligatorio";
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "La fecha fin no puede ser anterior al inicio";
  }
  if (values.sortOrder.trim()) {
    const n = Number(values.sortOrder);
    if (!Number.isInteger(n)) errors.sortOrder = "Debe ser un entero";
  }
  return errors;
}

export function PhaseForm({
  initial,
  submitLabel,
  submittingLabel,
  onSubmit,
  extraActions,
}: PhaseFormProps) {
  const [values, setValues] = useState<PhaseFormValues>(() => ({
    name: initial?.name ?? "",
    type: initial?.type ?? "group",
    status: initial?.status ?? "upcoming",
    sortOrder: initial?.sortOrder != null ? String(initial.sortOrder) : "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
  }));
  const [touched, setTouched] = useState<
    Partial<Record<keyof PhaseFormValues, boolean>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = validate(values);
  const visibleError = (field: keyof PhaseFormValues) =>
    touched[field] ? clientErrors[field] : undefined;

  const setField = <K extends keyof PhaseFormValues>(
    field: K,
    value: PhaseFormValues[K],
  ) => {
    setFormError(null);
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const blur = (field: keyof PhaseFormValues) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({
      name: true,
      type: true,
      status: true,
      sortOrder: true,
      startDate: true,
      endDate: true,
    });
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    const sortOrder = values.sortOrder.trim()
      ? Number(values.sortOrder)
      : undefined;

    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        type: values.type,
        status: values.status,
        sortOrder,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      });
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("No se pudo guardar la fase");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Nombre" htmlFor="phase-name" error={visibleError("name")}>
        <input
          id="phase-name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={blur("name")}
          className={inputClass(!!visibleError("name"))}
          placeholder="Fase de grupos"
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="phase-type" error={visibleError("type")}>
          <select
            id="phase-type"
            value={values.type}
            onChange={(e) => setField("type", e.target.value as PhaseType)}
            onBlur={blur("type")}
            className={inputClass(!!visibleError("type"))}
          >
            {(Object.keys(PHASE_TYPE_LABELS) as PhaseType[]).map((t) => (
              <option key={t} value={t}>
                {PHASE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Estado"
          htmlFor="phase-status"
          error={visibleError("status")}
        >
          <select
            id="phase-status"
            value={values.status}
            onChange={(e) => setField("status", e.target.value as PhaseStatus)}
            onBlur={blur("status")}
            className={inputClass(!!visibleError("status"))}
          >
            {(Object.keys(PHASE_STATUS_LABELS) as PhaseStatus[]).map((s) => (
              <option key={s} value={s}>
                {PHASE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field
          label="Orden"
          htmlFor="phase-order"
          optional
          error={visibleError("sortOrder")}
        >
          <input
            id="phase-order"
            type="number"
            value={values.sortOrder}
            onChange={(e) => setField("sortOrder", e.target.value)}
            onBlur={blur("sortOrder")}
            className={inputClass(!!visibleError("sortOrder"))}
            placeholder="1"
          />
        </Field>
        <Field
          label="Inicio"
          htmlFor="phase-start"
          optional
          error={visibleError("startDate")}
        >
          <input
            id="phase-start"
            type="date"
            value={values.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
            onBlur={blur("startDate")}
            className={inputClass(!!visibleError("startDate"))}
          />
        </Field>
        <Field
          label="Fin"
          htmlFor="phase-end"
          optional
          error={visibleError("endDate")}
        >
          <input
            id="phase-end"
            type="date"
            value={values.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
            onBlur={blur("endDate")}
            className={inputClass(!!visibleError("endDate"))}
          />
        </Field>
      </div>

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
