import { useMemo, useState } from "react";
import { ArrowLeftRight, CalendarPlus } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import {
  datetimeLocalToIso,
  getMatchErrorMessage,
  useAllMatches,
  useCreateMatches,
} from "../../matches";
import type { Team } from "../../teams";
import type { Phase, PhaseGroup, PhaseTeam } from "../types";
import { roundRobin } from "../utils/round-robin";

interface PhaseFixturesPanelProps {
  phase: Phase;
  groups: PhaseGroup[];
  teams: Team[];
  assignments: PhaseTeam[];
}

interface Fixture {
  key: string;
  groupId: string;
  groupName: string;
  round: number;
  homeId: string;
  awayId: string;
}

interface RowEdit {
  datetime?: string;
  venue?: string;
  swapped?: boolean;
  round?: number;
}

// "A vs B" y "B vs A" representan el mismo cruce.
const pairKey = (a: string, b: string) => [a, b].sort().join("|");

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function PhaseFixturesPanel({
  phase,
  groups,
  teams,
  assignments,
}: PhaseFixturesPanelProps) {
  // Consultar todos los partidos de esta fase, no solo la primera página.
  const matchesQuery = useAllMatches(phase.tournamentId, {
    phaseId: phase.id,
  });

  const createMatches = useCreateMatches(phase.tournamentId);

  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [defaultDatetime, setDefaultDatetime] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const { matches } = matchesQuery;
  const isCreating = createMatches.isPending;
  const existingCount = matches.length;

  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  // Identificar los enfrentamientos que ya existen en la fase.
  const existingPairs = useMemo(() => {
    const pairs = new Set<string>();

    for (const match of matches) {
      pairs.add(pairKey(match.homeTeamId, match.awayTeamId));
    }

    return pairs;
  }, [matches]);

  // Generar todos contra todos por grupo y excluir cruces existentes.
  const fixtures = useMemo(() => {
    const result: Fixture[] = [];

    for (const group of groups) {
      const groupTeams = assignments
        .filter((assignment) => assignment.phaseGroupId === group.id)
        .map((assignment) => teamById.get(assignment.teamId))
        .filter((team): team is Team => team !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

      for (const fixture of roundRobin(groupTeams)) {
        if (existingPairs.has(pairKey(fixture.home.id, fixture.away.id))) {
          continue;
        }

        result.push({
          key: `${group.id}:${fixture.home.id}:${fixture.away.id}`,
          groupId: group.id,
          groupName: group.name,
          round: fixture.round,
          homeId: fixture.home.id,
          awayId: fixture.away.id,
        });
      }
    }

    return result;
  }, [groups, assignments, teamById, existingPairs]);

  function resolve(fixture: Fixture) {
    const edit = edits[fixture.key] ?? {};
    const swapped = edit.swapped ?? false;

    return {
      homeId: swapped ? fixture.awayId : fixture.homeId,
      awayId: swapped ? fixture.homeId : fixture.awayId,
      round: edit.round ?? fixture.round,
      datetime: edit.datetime ?? "",
      venue: edit.venue ?? "",
    };
  }

  function updateEdit(key: string, patch: RowEdit) {
    setSummary(null);
    setEdits((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        ...patch,
      },
    }));
  }

  const visible = groupFilter
    ? fixtures.filter((fixture) => fixture.groupId === groupFilter)
    : fixtures;

  const withDate = fixtures.filter(
    (fixture) => resolve(fixture).datetime !== "",
  );

  const usingDefault = fixtures.length - withDate.length;

  // Cada cruce debe tener una fecha propia o una fecha por defecto.
  const canCreateAll =
    fixtures.length > 0 &&
    (defaultDatetime !== "" || withDate.length === fixtures.length);

  async function createFixtures(targets: Fixture[]) {
    setConfirming(false);
    setRowErrors({});
    setSummary(null);
    setProgress({ done: 0, total: targets.length });

    const items = targets.map((fixture) => {
      const row = resolve(fixture);
      const venue = row.venue.trim();

      return {
        key: fixture.key,
        input: {
          categoryId: phase.categoryId,
          homeTeamId: row.homeId,
          awayTeamId: row.awayId,
          scheduledAt: datetimeLocalToIso(row.datetime || defaultDatetime),
          ...(venue ? { venue } : {}),
          phaseId: phase.id,
          phaseGroupId: fixture.groupId,
          round: row.round,
        },
      };
    });

    try {
      const { created, errors } = await createMatches.mutateAsync({
        items,
        onProgress: (done, total) => setProgress({ done, total }),
      });

      const messages: Record<string, string> = {};

      for (const [key, error] of Object.entries(errors)) {
        messages[key] = getMatchErrorMessage(error);
      }

      setRowErrors(messages);

      const failed = Object.keys(messages).length;

      setSummary(
        failed === 0
          ? {
              ok: true,
              text: `Se crearon ${created} partidos.`,
            }
          : {
              ok: false,
              text: `Se crearon ${created} partidos; ${failed} fallaron. Revisa las filas marcadas.`,
            },
      );
    } catch {
      setSummary({
        ok: false,
        text: "No se pudieron crear los partidos. Comprueba tu conexión e inténtalo de nuevo.",
      });
    }
  }

  // No permitir generar partidos hasta conocer los que ya existen.
  if (matchesQuery.isLoading) {
    return (
      <Card className="p-6">
        <div
          className="h-2 w-full animate-pulse rounded-xl bg-slate-200"
          role="status"
          aria-label="Cargando partidos"
        />
        <p className="mt-3 text-sm text-slate-500">
          Cargando los partidos existentes de la fase…
        </p>
      </Card>
    );
  }

  if (matchesQuery.isError) {
    return (
      <Card className="border-red-100 p-6 text-center text-sm text-red-700">
        No se pudieron consultar los partidos existentes. No generaremos nuevos
        cruces para evitar duplicados. Recarga la página e inténtalo de nuevo.
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          Calendario de la fase
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {existingCount} partidos creados · {fixtures.length} cruces por crear
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          La hora se interpreta en la zona horaria de tu navegador.
        </p>
      </div>

      {fixtures.length > 0 && (
        <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Fecha por defecto (para los cruces sin fecha propia)
              <input
                type="datetime-local"
                value={defaultDatetime}
                onChange={(event) => setDefaultDatetime(event.target.value)}
                className={`${inputClass} lg:w-56`}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={!canCreateAll || isCreating}
              >
                <CalendarPlus size={16} />
                {isCreating
                  ? `Creando ${progress.done}/${progress.total}…`
                  : `Crear todos (${fixtures.length})`}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => void createFixtures(withDate)}
                disabled={withDate.length === 0 || isCreating}
              >
                Solo los que tienen fecha ({withDate.length})
              </Button>
            </div>
          </div>

          {isCreating && progress.total > 0 && (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-slate-200"
              aria-label="Progreso de creación"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${Math.round(
                    (progress.done / progress.total) * 100,
                  )}%`,
                }}
              />
            </div>
          )}

          {confirming && !isCreating && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">
                Se crearán {fixtures.length} partidos.
              </p>

              {usingDefault > 0 && (
                <p className="mt-0.5 text-xs text-amber-800">
                  {usingDefault} usarán la fecha por defecto; podrás corregirla
                  después.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void createFixtures(fixtures)}
                >
                  Sí, crear {fixtures.length}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {summary && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            summary.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {summary.text}
        </p>
      )}

      {fixtures.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No hay cruces pendientes: todos los partidos de los grupos ya existen.
        </p>
      ) : (
        <>
          <div className="mb-3">
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              className={`${inputClass} sm:w-56`}
              aria-label="Filtrar por grupo"
            >
              <option value="">Todos los grupos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[36rem] overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Grupo</th>
                  <th className="w-24 px-3 py-2 font-medium">Jornada</th>
                  <th className="px-3 py-2 font-medium">Partido</th>
                  <th className="w-56 px-3 py-2 font-medium">Fecha y hora</th>
                  <th className="w-48 px-3 py-2 font-medium">Sede</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((fixture) => {
                  const row = resolve(fixture);
                  const home = teamById.get(row.homeId)?.name ?? "—";
                  const away = teamById.get(row.awayId)?.name ?? "—";
                  const error = rowErrors[fixture.key];

                  return (
                    <tr
                      key={fixture.key}
                      className={`border-t border-slate-100 align-top ${
                        error ? "bg-red-50/60" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 text-slate-600">
                        {fixture.groupName}
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={row.round}
                          onChange={(event) =>
                            updateEdit(fixture.key, {
                              round: Math.max(
                                1,
                                Number(event.target.value) || 1,
                              ),
                            })
                          }
                          className={inputClass}
                          aria-label={`Jornada de ${home} contra ${away}`}
                        />
                      </td>

                      <td className="px-3 py-2.5 text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>
                            {home} <span className="text-slate-400">vs</span>{" "}
                            {away}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateEdit(fixture.key, {
                                swapped: !(
                                  edits[fixture.key]?.swapped ?? false
                                ),
                              })
                            }
                            title="Intercambiar local y visitante"
                            aria-label="Intercambiar local y visitante"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <ArrowLeftRight size={15} />
                          </button>
                        </div>

                        {error && (
                          <p className="mt-1 text-xs text-red-600">{error}</p>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="datetime-local"
                          value={row.datetime}
                          onChange={(event) =>
                            updateEdit(fixture.key, {
                              datetime: event.target.value,
                            })
                          }
                          className={inputClass}
                          aria-label={`Fecha de ${home} contra ${away}`}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="text"
                          maxLength={200}
                          value={row.venue}
                          onChange={(event) =>
                            updateEdit(fixture.key, {
                              venue: event.target.value,
                            })
                          }
                          placeholder="Opcional"
                          className={inputClass}
                          aria-label={`Sede de ${home} contra ${away}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
