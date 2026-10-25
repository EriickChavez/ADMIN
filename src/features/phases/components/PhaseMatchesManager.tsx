import { useMemo, useState } from "react";
import { CalendarClock, Save } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { isoToDatetimeLocal, useMatches, useUpdateMatch } from "../../matches";
import type { Match, MatchStatus } from "../../matches/types";
import { MATCH_STATUS_LABELS } from "../../matches/types";
import { useTeams } from "../../teams";
import type { Phase } from "../types";

interface MatchDraft {
  scheduledAt: string;
  venue: string;
  status: MatchStatus;
  homeScore: string;
  awayScore: string;
}

const inputClass =
  "min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function createDraft(match: Match): MatchDraft {
  return {
    scheduledAt: isoToDatetimeLocal(match.scheduledAt),
    venue: match.venue ?? "",
    status: match.status,
    homeScore: match.homeScore == null ? "" : String(match.homeScore),
    awayScore: match.awayScore == null ? "" : String(match.awayScore),
  };
}

export function PhaseMatchesManager({ phase }: { phase: Phase }) {
  const matchesQuery = useMatches(phase.tournamentId, {
    phaseId: phase.id,
    limit: 100,
  });

  const teamsQuery = useTeams(phase.tournamentId, {
    categoryId: phase.categoryId,
    limit: 100,
  });

  const updateMatch = useUpdateMatch(phase.tournamentId);

  const [drafts, setDrafts] = useState<Record<string, MatchDraft>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const teamById = useMemo(
    () => new Map(teamsQuery.teams.map((team) => [team.id, team.name])),
    [teamsQuery.teams],
  );

  const matches = matchesQuery.matches;

  function getDraft(match: Match): MatchDraft {
    return drafts[match.id] ?? createDraft(match);
  }

  function patchDraft(match: Match, patch: Partial<MatchDraft>) {
    setSavedId(null);

    setErrors((current) => {
      const next = { ...current };
      delete next[match.id];
      return next;
    });

    setDrafts((current) => ({
      ...current,
      [match.id]: {
        ...getDraft(match),
        ...patch,
      },
    }));
  }

  async function saveMatch(match: Match) {
    const draft = getDraft(match);

    const homeScore =
      draft.homeScore.trim() === "" ? null : Number(draft.homeScore);

    const awayScore =
      draft.awayScore.trim() === "" ? null : Number(draft.awayScore);

    if ((homeScore === null) !== (awayScore === null)) {
      setErrors((current) => ({
        ...current,
        [match.id]: "Captura ambos marcadores o deja ambos vacíos.",
      }));
      return;
    }

    if (
      [homeScore, awayScore].some(
        (score) => score !== null && (!Number.isInteger(score) || score < 0),
      )
    ) {
      setErrors((current) => ({
        ...current,
        [match.id]:
          "Los marcadores deben ser enteros iguales o mayores que cero.",
      }));
      return;
    }

    if (!draft.scheduledAt) {
      setErrors((current) => ({
        ...current,
        [match.id]: "Indica la fecha y hora del partido.",
      }));
      return;
    }

    const scheduledDate = new Date(draft.scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
      setErrors((current) => ({
        ...current,
        [match.id]: "La fecha y hora no son válidas.",
      }));
      return;
    }

    try {
      await updateMatch.mutateAsync({
        matchId: match.id,
        input: {
          scheduledAt: scheduledDate.toISOString(),
          venue: draft.venue.trim() || null,
          status: draft.status,
          homeScore,
          awayScore,
        },
      });

      setDrafts((current) => {
        const next = { ...current };
        delete next[match.id];
        return next;
      });

      setErrors((current) => {
        const next = { ...current };
        delete next[match.id];
        return next;
      });

      setSavedId(match.id);
    } catch {
      setErrors((current) => ({
        ...current,
        [match.id]: "No se pudo guardar el partido. Inténtalo de nuevo.",
      }));
    }
  }

  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Partidos programados
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Consulta y actualiza la programación, el estado y el marcador de cada
          encuentro.
        </p>
      </div>

      {matchesQuery.isLoading || teamsQuery.isLoading ? (
        <div className="h-36 animate-pulse rounded-xl bg-slate-200/70" />
      ) : matchesQuery.isError || teamsQuery.isError ? (
        <Card className="p-5 text-sm text-red-700">
          No se pudieron cargar los partidos de esta fase.
        </Card>
      ) : matches.length === 0 ? (
        <Card className="p-6 text-center">
          <CalendarClock size={25} className="mx-auto text-slate-300" />

          <p className="mt-2 text-sm font-semibold text-slate-800">
            Todavía no hay partidos
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Cuando generes el calendario, los encuentros aparecerán aquí para
            administrarlos.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const draft = getDraft(match);

            const isSaving =
              updateMatch.isPending &&
              updateMatch.variables?.matchId === match.id;

            return (
              <Card key={match.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">
                        {teamById.get(match.homeTeamId) ?? "Equipo local"}{" "}
                        <span className="font-normal text-slate-400">vs</span>{" "}
                        {teamById.get(match.awayTeamId) ?? "Equipo visitante"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {match.round ? `Jornada ${match.round}` : "Partido"}
                        {match.phaseGroupId ? " · Partido de grupo" : ""}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {MATCH_STATUS_LABELS[match.status]}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                      Fecha y hora
                      <input
                        type="datetime-local"
                        value={draft.scheduledAt}
                        onChange={(event) =>
                          patchDraft(match, {
                            scheduledAt: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                      Sede
                      <input
                        value={draft.venue}
                        onChange={(event) =>
                          patchDraft(match, {
                            venue: event.target.value,
                          })
                        }
                        placeholder="Cancha o estadio"
                        className={inputClass}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                      Estado
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          patchDraft(match, {
                            status: event.target.value as MatchStatus,
                          })
                        }
                        className={inputClass}
                      >
                        {Object.entries(MATCH_STATUS_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                      <span>Marcador</span>

                      <div className="flex items-center gap-2">
                        <input
                          aria-label="Goles del equipo local"
                          type="number"
                          min={0}
                          step={1}
                          value={draft.homeScore}
                          onChange={(event) =>
                            patchDraft(match, {
                              homeScore: event.target.value,
                            })
                          }
                          placeholder="Local"
                          className={`${inputClass} text-center`}
                        />

                        <span className="text-slate-400">–</span>

                        <input
                          aria-label="Goles del equipo visitante"
                          type="number"
                          min={0}
                          step={1}
                          value={draft.awayScore}
                          onChange={(event) =>
                            patchDraft(match, {
                              awayScore: event.target.value,
                            })
                          }
                          placeholder="Visita"
                          className={`${inputClass} text-center`}
                        />
                      </div>
                    </div>
                  </div>

                  {errors[match.id] && (
                    <p
                      role="alert"
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                      {errors[match.id]}
                    </p>
                  )}

                  {savedId === match.id && (
                    <p
                      role="status"
                      className="text-sm font-medium text-emerald-700"
                    >
                      Cambios guardados.
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void saveMatch(match)}
                      disabled={isSaving}
                    >
                      <Save size={15} />
                      {isSaving ? "Guardando…" : "Guardar partido"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
