import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../../api/client";
import { Button } from "../../../shared/components/ui/Button";
import type { Category } from "../../categories";
import type { Team } from "../../teams";
import type { Player, PlayerFormValues, PlayerInput } from "../types";

interface PlayerFormProps {
  initial?: Player | null;
  categories: Category[];
  teams: Team[];
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: PlayerInput) => Promise<void>;
  extraActions?: ReactNode;
  defaultTeamId?: string;
  defaultCategoryId?: string;
}

type Errors = Partial<Record<keyof PlayerFormValues, string>>;

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

function validate(values: PlayerFormValues): Errors {
  const errors: Errors = {};
  if (!values.categoryId) errors.categoryId = "Elige una categoría";
  if (!values.teamId) errors.teamId = "Elige un equipo";
  if (!values.firstName.trim()) errors.firstName = "El nombre es obligatorio";
  if (!values.lastName.trim()) errors.lastName = "El apellido es obligatorio";
  // API: number es obligatorio en create (0–999)
  if (!values.number.trim()) {
    errors.number = "El número es obligatorio";
  } else {
    const n = Number(values.number);
    if (!Number.isInteger(n) || n < 0 || n > 999) {
      errors.number = "Usa un número entero entre 0 y 999";
    }
  }
  return errors;
}

export function PlayerForm({
  initial,
  categories,
  teams,
  submitLabel,
  submittingLabel,
  onSubmit,
  extraActions,
  defaultTeamId,
  defaultCategoryId,
}: PlayerFormProps) {
  const initialTeam = teams.find(
    (t) => t.id === (initial?.teamId ?? defaultTeamId),
  );

  const [values, setValues] = useState<PlayerFormValues>(() => ({
    categoryId:
      initial?.categoryId ?? defaultCategoryId ?? initialTeam?.categoryId ?? "",
    teamId: initial?.teamId ?? defaultTeamId ?? "",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    birthDate: initial?.birthDate ?? "",
    number: initial?.number != null ? String(initial.number) : "",
    isCaptain: initial?.isCaptain ?? false,
    role: initial?.role ?? "",
  }));
  const [touched, setTouched] = useState<
    Partial<Record<keyof PlayerFormValues, boolean>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const teamsInCategory = useMemo(
    () =>
      values.categoryId
        ? teams.filter((t) => t.categoryId === values.categoryId)
        : teams,
    [teams, values.categoryId],
  );

  const clientErrors = validate(values);
  const visibleError = (field: keyof PlayerFormValues) =>
    touched[field] ? clientErrors[field] : undefined;

  const setField = <K extends keyof PlayerFormValues>(
    field: K,
    value: PlayerFormValues[K],
  ) => {
    setFormError(null);
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "categoryId") {
        const stillValid = teams.some(
          (t) => t.id === prev.teamId && t.categoryId === value,
        );
        if (!stillValid) next.teamId = "";
      }
      return next;
    });
  };

  const blur = (field: keyof PlayerFormValues) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({
      categoryId: true,
      teamId: true,
      firstName: true,
      lastName: true,
      number: true,
    });
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    const num = Number(values.number);

    setSubmitting(true);
    try {
      await onSubmit({
        categoryId: values.categoryId,
        teamId: values.teamId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        birthDate: values.birthDate || null,
        number: num,
        isCaptain: values.isCaptain,
        role: values.role.trim() || null,
      });
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("No se pudo guardar el jugador");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Categoría"
          htmlFor="player-category"
          error={visibleError("categoryId")}
        >
          <select
            id="player-category"
            value={values.categoryId}
            onChange={(e) => setField("categoryId", e.target.value)}
            onBlur={blur("categoryId")}
            className={inputClass(!!visibleError("categoryId"))}
          >
            <option value="">Selecciona</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Equipo"
          htmlFor="player-team"
          error={visibleError("teamId")}
        >
          <select
            id="player-team"
            value={values.teamId}
            onChange={(e) => setField("teamId", e.target.value)}
            onBlur={blur("teamId")}
            className={inputClass(!!visibleError("teamId"))}
            disabled={!values.categoryId && teamsInCategory.length === 0}
          >
            <option value="">Selecciona</option>
            {teamsInCategory.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.abbreviation})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Nombre"
          htmlFor="player-first"
          error={visibleError("firstName")}
        >
          <input
            id="player-first"
            value={values.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            onBlur={blur("firstName")}
            className={inputClass(!!visibleError("firstName"))}
            placeholder="Carlos"
            autoComplete="off"
          />
        </Field>
        <Field
          label="Apellido"
          htmlFor="player-last"
          error={visibleError("lastName")}
        >
          <input
            id="player-last"
            value={values.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            onBlur={blur("lastName")}
            className={inputClass(!!visibleError("lastName"))}
            placeholder="Ramírez"
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field
          label="Fecha de nacimiento"
          htmlFor="player-birth"
          optional
          error={visibleError("birthDate")}
        >
          <input
            id="player-birth"
            type="date"
            value={values.birthDate}
            onChange={(e) => setField("birthDate", e.target.value)}
            onBlur={blur("birthDate")}
            className={inputClass(!!visibleError("birthDate"))}
          />
        </Field>
        <Field
          label="Número"
          htmlFor="player-number"
          error={visibleError("number")}
          hint="Obligatorio · 0 a 999"
        >
          <input
            id="player-number"
            type="number"
            min={0}
            max={999}
            value={values.number}
            onChange={(e) => setField("number", e.target.value)}
            onBlur={blur("number")}
            className={inputClass(!!visibleError("number"))}
            placeholder="10"
          />
        </Field>
        <Field
          label="Rol"
          htmlFor="player-role"
          optional
          error={visibleError("role")}
        >
          <input
            id="player-role"
            value={values.role}
            onChange={(e) => setField("role", e.target.value)}
            onBlur={blur("role")}
            className={inputClass(!!visibleError("role"))}
            placeholder="Portero, defensa…"
            autoComplete="off"
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={values.isCaptain}
          onChange={(e) => setField("isCaptain", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Es capitán del equipo
      </label>

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
