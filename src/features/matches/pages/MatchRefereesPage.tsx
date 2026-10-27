import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, UserCheck } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useAuth } from "../../auth";
import { useMembers } from "../../members";
import { useAllTeams } from "../../teams";
import { useMatch, useMatchReferees, useSetMatchReferees } from "../hooks";
import type { Match } from "../types";
import { getMatchErrorMessage } from "../utils/errors";

const MAX_REFEREES = 10;

function RefereesContent({ match }: { match: Match }) {
  const { user } = useAuth();
  const membersQuery = useMembers(match.tournamentId);
  const refereesQuery = useMatchReferees(match.id);
  const setReferees = useSetMatchReferees(match.id);
  const teamsQuery = useAllTeams(match.tournamentId, {
    categoryId: match.categoryId,
  });

  // null = sin cambios del usuario: se muestra lo que hay en el servidor.
  const [draft, setDraft] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const members = [...membersQuery.members].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es"),
  );

  // Solo el dueño del torneo puede asignar; los demás ven la lista.
  const canEdit =
    members.find((m) => m.userId === user?.id)?.roleName === "OWNER";

  const serverIds = refereesQuery.refereeUserIds;
  const selected = draft ?? serverIds;
  const isLoading = membersQuery.isLoading || refereesQuery.isLoading;
  const loadError = membersQuery.error ?? refereesQuery.error;
  const isDirty =
    draft !== null &&
    (draft.length !== serverIds.length ||
      draft.some((id) => !serverIds.includes(id)));

  const teamName = new Map(teamsQuery.teams.map((t) => [t.id, t.name]));
  const home =
    match.homeTeam?.name ?? teamName.get(match.homeTeamId) ?? "Local";
  const away =
    match.awayTeam?.name ?? teamName.get(match.awayTeamId) ?? "Visitante";

  function toggle(userId: string) {
    setError(null);
    setSaved(false);
    setDraft(
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId],
    );
  }

  function handleSave() {
    setError(null);
    setReferees.mutate(selected, {
      onSuccess: () => {
        setDraft(null);
        setSaved(true);
      },
      onError: (err) => setError(getMatchErrorMessage(err)),
    });
  }

  const assigned = members.filter((m) => selected.includes(m.userId));

  return (
    <div>
      <Link
        to="/calendar"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        Calendario
      </Link>

      <Card className="mb-6 p-5 sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Árbitros del partido
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {home} vs {away} ·{" "}
          {new Date(match.scheduledAt).toLocaleString("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </Card>

      <Card className="p-5 sm:p-6">
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        ) : loadError ? (
          <p className="text-sm text-red-600">
            {getMatchErrorMessage(loadError)}
          </p>
        ) : canEdit ? (
          <ul className="space-y-2">
            {members.map((member) => {
              const checked = selected.includes(member.userId);
              const disabled = !checked && selected.length >= MAX_REFEREES;
              return (
                <li key={member.id}>
                  <label
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      checked
                        ? "border-blue-500 bg-blue-50/60"
                        : "border-slate-200 hover:bg-slate-50"
                    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(member.userId)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">
                      {member.displayName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {member.displayName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {member.roleName === "OWNER" ? "Dueño" : "Admin"}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : assigned.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Sin árbitros asignados"
            description="Solo el dueño del torneo puede asignar árbitros."
          />
        ) : (
          <div>
            <ul className="space-y-2">
              {assigned.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">
                    {member.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <p className="text-sm font-medium text-slate-900">
                    {member.displayName}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              Solo el dueño del torneo puede asignar árbitros.
            </p>
          </div>
        )}

        {!isLoading && !loadError && (
          <p className="mt-4 text-xs text-slate-400">
            Sin árbitros asignados, cualquier administrador del torneo puede
            operar la cédula. Con árbitros asignados, solo ellos y el dueño.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {saved && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            Árbitros guardados.
          </p>
        )}

        {canEdit && !isLoading && !loadError && (
          <div className="mt-5 flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || setReferees.isPending}
            >
              {setReferees.isPending ? "Guardando…" : "Guardar"}
            </Button>
            <span className="text-xs text-slate-400">
              {selected.length} de {MAX_REFEREES} árbitros
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

export function MatchRefereesPage() {
  const { id } = useParams<{ id: string }>();
  const { match, isLoading } = useMatch(id);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />;
  }

  if (!match) {
    return (
      <Card>
        <EmptyState
          icon={UserCheck}
          title="Partido no encontrado"
          description="Puede que se haya eliminado o que el enlace sea incorrecto."
          action={
            <Link
              to="/calendar"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ir al calendario →
            </Link>
          }
        />
      </Card>
    );
  }

  // key: al cambiar de partido se reinicia el borrador.
  return <RefereesContent key={match.id} match={match} />;
}
