import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useCategories } from "../../categories";
import { useAllTeams } from "../../teams";
import { useMyTournament } from "../../tournaments";
import { useCreateMatch } from "../hooks";
import { datetimeLocalToIso } from "../utils/datetime";
import { getMatchErrorMessage } from "../utils/errors";

const inputClass =
  "mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";

type FieldErrors = Partial<
  Record<"categoryId" | "homeTeamId" | "awayTeamId" | "scheduledAt", string>
>;

export function MatchNewPage() {
  const navigate = useNavigate();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const teamsQuery = useAllTeams(tournament?.id, {});
  const createMatch = useCreateMatch(tournament?.id ?? "");

  const [categoryId, setCategoryId] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (loadingTournament || (tournament && loadingCategories)) {
    return <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />;
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader title="Nuevo partido" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <CalendarDays size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Primero crea tu torneo
          </p>
          <Link
            to="/tournament"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear torneo →
          </Link>
        </Card>
      </div>
    );
  }

  const categoryTeams = teamsQuery.teams.filter(
    (team) => team.categoryId === categoryId,
  );

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!categoryId) next.categoryId = "Selecciona una categoría";
    if (!homeTeamId) next.homeTeamId = "Selecciona el equipo local";
    if (!awayTeamId) next.awayTeamId = "Selecciona el equipo visitante";
    if (homeTeamId && homeTeamId === awayTeamId) {
      next.awayTeamId = "El equipo local y visitante deben ser diferentes";
    }
    if (!scheduledAt) next.scheduledAt = "La fecha y hora son obligatorias";
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const created = await createMatch.mutateAsync({
        categoryId,
        homeTeamId,
        awayTeamId,
        scheduledAt: datetimeLocalToIso(scheduledAt),
        ...(venue.trim() ? { venue: venue.trim() } : {}),
      });
      navigate(`/matches/${created.id}`, { replace: true });
    } catch (err) {
      setFormError(getMatchErrorMessage(err));
    }
  }

  const errorText = (field: keyof FieldErrors) =>
    errors[field] && (
      <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
    );

  return (
    <div>
      <PageHeader
        title="Nuevo partido"
        description="Crea un partido suelto, fuera del calendario de una fase."
      />

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Categoría
            <select
              className={inputClass}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setHomeTeamId("");
                setAwayTeamId("");
              }}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
            {errorText("categoryId")}
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Equipo local
              <select
                className={inputClass}
                value={homeTeamId}
                disabled={!categoryId || teamsQuery.isLoading}
                onChange={(e) => setHomeTeamId(e.target.value)}
              >
                <option value="">
                  {categoryId
                    ? "Selecciona el equipo local"
                    : "Elige primero la categoría"}
                </option>
                {categoryTeams
                  .filter((team) => team.id !== awayTeamId)
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
              {errorText("homeTeamId")}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Equipo visitante
              <select
                className={inputClass}
                value={awayTeamId}
                disabled={!categoryId || teamsQuery.isLoading}
                onChange={(e) => setAwayTeamId(e.target.value)}
              >
                <option value="">
                  {categoryId
                    ? "Selecciona el equipo visitante"
                    : "Elige primero la categoría"}
                </option>
                {categoryTeams
                  .filter((team) => team.id !== homeTeamId)
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
              {errorText("awayTeamId")}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Fecha y hora
              <input
                className={inputClass}
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              {errorText("scheduledAt")}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Sede{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
              <input
                className={inputClass}
                value={venue}
                maxLength={200}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Nombre de la cancha"
              />
            </label>
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={createMatch.isPending}>
              {createMatch.isPending ? "Creando…" : "Crear partido"}
            </Button>
            <Link
              to="/calendar"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
