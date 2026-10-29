import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, UserCheck, UserPlus } from "lucide-react";
import { Button, ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useAuth } from "../../auth";
import { useMembers, type Member } from "../../members";
import { useAllTeams } from "../../teams";
import { useMatch, useMatchReferees, useSetMatchReferees } from "../hooks";
import type { Match } from "../types";
import { getMatchErrorMessage } from "../utils/errors";

const MAX_REFEREES = 10;

const isRole = (member: Member, role: "OWNER" | "ADMIN") =>
  member.roleName?.toUpperCase() === role;

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

  const allMembers = membersQuery.members;

  // Solo el dueño asigna árbitros.
  const myMember = allMembers.find((m) => m.userId === user?.id);
  const canEdit = !!myMember && isRole(myMember, "OWNER");

  // Los árbitros son los miembros con rol Admin. El dueño administra el torneo,
  // pero no arbitra: no aparece como opción.
  const candidates = allMembers
    .filter((m) => isRole(m, "ADMIN"))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
  const candidateIds = new Set(candidates.map((m) => m.userId));

  const serverIds = refereesQuery.refereeUserIds;
  // Si el servidor trae a alguien que no es Admin (por ejemplo el dueño), no se
  // preselecciona: al guardar se quita.
  const hasIneligible = serverIds.some((id) => !candidateIds.has(id));
  const selected = draft ?? serverIds.filter((id) => candidateIds.has(id));

  const isLoading = membersQuery.isLoading || refereesQuery.isLoading;
  const loadError = membersQuery.error ?? refereesQuery.error;
  const isDirty =
    selected.length !== serverIds.length ||
    selected.some((id) => !serverIds.includes(id));

  const assignedMembers = allMembers.filter((m) =>
    serverIds.includes(m.userId),
  );

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
          candidates.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Aún no tienes árbitros"
              description="Los árbitros son los miembros con rol Admin. Invita o crea uno en Miembros y vuelve aquí para asignarlo al partido."
              action={
                <ButtonLink to="/tournament/members">
                  <UserPlus size={16} />
                  Ir a Miembros
                </ButtonLink>
              }
            />
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                Elige quién arbitra este partido. Solo aparecen los miembros con
                rol Admin.
              </p>
              <ul className="space-y-2">
                {candidates.map((member) => {
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
                        <p className="min-w-0 truncate text-sm font-medium text-slate-900">
                          {member.displayName}
                        </p>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {hasIneligible && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Este partido tiene asignado a alguien que no es Admin (por
                  ejemplo el dueño). Se quitará al guardar.
                </p>
              )}
            </>
          )
        ) : assignedMembers.length === 0 ? (
          <div>
            <EmptyState
              icon={UserCheck}
              title="Sin árbitros asignados"
              description="Solo el dueño del torneo puede asignar árbitros."
            />
            <p className="text-center text-xs text-slate-400">
              {myMember
                ? `Tu rol en este torneo: ${isRole(myMember, "OWNER") ? "Dueño" : "Admin"}.`
                : "No encontramos tu usuario entre los miembros del torneo."}
            </p>
          </div>
        ) : (
          <div>
            <ul className="space-y-2">
              {assignedMembers.map((member) => (
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
              {myMember
                ? ` Tu rol: ${isRole(myMember, "OWNER") ? "Dueño" : "Admin"}.`
                : " No encontramos tu usuario entre los miembros del torneo."}
            </p>
          </div>
        )}

        {!isLoading && !loadError && (
          <p className="mt-4 text-xs text-slate-400">
            Sin árbitros asignados, cualquier Admin del torneo puede operar la
            cédula. Con árbitros asignados, solo ellos y el dueño.
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

        {canEdit && !isLoading && !loadError && candidates.length > 0 && (
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
