import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { Card } from "../../../shared/components/ui/Card";
import { useMatches } from "../../matches";
import { useTeams } from "../../teams";
import { usePhaseGroups, usePhaseTeams } from "../hooks";
import type { Phase, PhaseGroup } from "../types";

interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const numberCell = "px-3 py-3 text-center text-xs tabular-nums text-slate-700";

function buildStandings(
  group: PhaseGroup,
  teamNames: Map<string, string>,
  teamIds: string[],
  matches: ReturnType<typeof useMatches>["matches"],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  for (const teamId of teamIds) {
    rows.set(teamId, {
      teamId,
      teamName: teamNames.get(teamId) ?? "Equipo sin nombre",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.phaseGroupId !== group.id || match.status !== "finished") {
      continue;
    }

    if (match.homeScore == null || match.awayScore == null) {
      continue;
    }

    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);

    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...rows.values()].sort((a, b) => {
    const goalDifference =
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);

    return (
      b.points - a.points ||
      goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName, "es")
    );
  });
}

export function PhaseStandingsPanel({ phase }: { phase: Phase }) {
  const groupsQuery = usePhaseGroups(phase.id);
  const assignmentsQuery = usePhaseTeams(phase.id);

  const teamsQuery = useTeams(phase.tournamentId, {
    categoryId: phase.categoryId,
    limit: 100,
  });

  const matchesQuery = useMatches(phase.tournamentId, {
    phaseId: phase.id,
    limit: 100,
  });

  const teamNames = useMemo(
    () => new Map(teamsQuery.teams.map((team) => [team.id, team.name])),
    [teamsQuery.teams],
  );

  const assignmentsByGroup = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const assignment of assignmentsQuery.assignments) {
      if (!assignment.phaseGroupId) continue;

      const ids = map.get(assignment.phaseGroupId) ?? [];
      ids.push(assignment.teamId);
      map.set(assignment.phaseGroupId, ids);
    }

    return map;
  }, [assignmentsQuery.assignments]);

  const isLoading =
    groupsQuery.isLoading ||
    assignmentsQuery.isLoading ||
    teamsQuery.isLoading ||
    matchesQuery.isLoading;

  const isError =
    groupsQuery.isError ||
    assignmentsQuery.isError ||
    teamsQuery.isError ||
    matchesQuery.isError;

  const matches = matchesQuery.matches;
  const truncated =
    (matchesQuery.pagination?.total ?? matches.length) > matches.length;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <Trophy size={19} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Tablas de posiciones
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Victoria = 3 puntos, empate = 1 y derrota = 0. Solo cuentan los
            partidos finalizados con marcador registrado.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-slate-200/70" />
      ) : isError ? (
        <Card className="p-5 text-sm text-red-700">
          No se pudieron calcular las posiciones de esta fase.
        </Card>
      ) : groupsQuery.groups.length === 0 ? (
        <Card className="p-5 text-sm text-slate-500">
          Crea los grupos y asigna equipos para ver las tablas de posiciones.
        </Card>
      ) : (
        <div className="space-y-5">
          {groupsQuery.groups.map((group) => {
            const teamIds = assignmentsByGroup.get(group.id) ?? [];
            const standings = buildStandings(
              group,
              teamNames,
              teamIds,
              matches,
            );

            const countedMatches =
              standings.reduce((total, row) => total + row.played, 0) / 2;

            return (
              <Card key={group.id} className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                  <div>
                    <h3 className="font-bold text-slate-900">{group.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {teamIds.length} equipos · {countedMatches} partidos
                      contabilizados
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {standings.filter((row) => row.played > 0).length} con
                    actividad
                  </span>
                </div>

                {standings.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">
                    Todavía no hay equipos asignados a este grupo.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] border-collapse text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-4">
                            #
                          </th>
                          <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Equipo
                          </th>
                          <th className={numberCell}>PJ</th>
                          <th className={numberCell}>G</th>
                          <th className={numberCell}>E</th>
                          <th className={numberCell}>P</th>
                          <th className={numberCell}>GF</th>
                          <th className={numberCell}>GC</th>
                          <th className={numberCell}>DG</th>
                          <th className={`${numberCell} font-bold`}>Pts</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {standings.map((row, index) => {
                          const goalDifference =
                            row.goalsFor - row.goalsAgainst;

                          return (
                            <tr
                              key={row.teamId}
                              className={
                                index === 0 && row.played > 0
                                  ? "bg-emerald-50/60"
                                  : "bg-white"
                              }
                            >
                              <td className="px-3 py-3 text-xs font-bold text-slate-500 sm:px-4">
                                {index + 1}
                              </td>
                              <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                                {row.teamName}
                              </td>
                              <td className={numberCell}>{row.played}</td>
                              <td className={numberCell}>{row.won}</td>
                              <td className={numberCell}>{row.drawn}</td>
                              <td className={numberCell}>{row.lost}</td>
                              <td className={numberCell}>{row.goalsFor}</td>
                              <td className={numberCell}>{row.goalsAgainst}</td>
                              <td className={numberCell}>
                                {goalDifference > 0
                                  ? `+${goalDifference}`
                                  : goalDifference}
                              </td>
                              <td
                                className={`${numberCell} font-bold text-slate-900`}
                              >
                                {row.points}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {truncated && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          La fase tiene más partidos de los que se cargaron en esta vista. Las
          posiciones podrían estar incompletas; es necesario cargar todos los
          resultados para garantizar el cálculo correcto.
        </p>
      )}

      <p className="text-xs leading-5 text-slate-400">
        Desempates provisionales por puntos, diferencia de goles, goles a favor
        y nombre del equipo. Las reglas oficiales pueden variar según el torneo.
      </p>
    </section>
  );
}
