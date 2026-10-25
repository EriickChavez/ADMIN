import { useMemo, useState, type ReactNode } from "react";
import { Check, RefreshCw } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { ConfirmBox } from "../../../shared/components/ui/ConfirmBox";
import { useAllTeams } from "../../teams";
import {
  useClosePhase,
  usePhaseStandings,
  useReopenPhase,
  useSetManualRanks,
} from "../hooks";
import type { Phase, StandingRow } from "../types";
import { getPhaseErrorMessage } from "../utils/errors";
import { PhaseTieResolver } from "./PhaseTieResolver";

interface GroupTie {
  key: string;
  groupName: string;
  rows: StandingRow[];
  affectsQualification: boolean;
}

type PendingAction = "close" | "reopen" | "clear" | null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const HEAD = "px-2 py-2 text-center font-medium";
const CELL = "px-2 py-1.5 text-center text-slate-700";

const numberInput =
  "w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500";

function CheckItem({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        {ok ? <Check size={11} /> : <span className="text-[9px]">●</span>}
      </span>
      <span className={ok ? "text-slate-700" : "text-slate-500"}>
        {children}
      </span>
    </li>
  );
}

export function PhaseStandingsPanel({ phase }: { phase: Phase }) {
  const tournamentId = phase.tournamentId;
  const phaseId = phase.id;

  const [perGroup, setPerGroup] = useState(2);
  const [bestNext, setBestNext] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncedClosureAt, setSyncedClosureAt] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const teamsQuery = useAllTeams(tournamentId, {
    categoryId: phase.categoryId,
  });
  const { data, isLoading, isFetching, error, refetch } = usePhaseStandings(
    tournamentId,
    phaseId,
    perGroup,
    bestNext,
  );
  const setRanks = useSetManualRanks(tournamentId, phaseId);
  const closePhase = useClosePhase(tournamentId, phaseId);
  const reopenPhase = useReopenPhase(tournamentId, phaseId);

  const closure = data?.closure ?? null;

  // Con la fase cerrada, los números de clasificación son los del cierre. Se ajusta
  // durante el render (patrón recomendado por React) en vez de con un useEffect.
  if (closure && syncedClosureAt !== closure.closedAt) {
    setSyncedClosureAt(closure.closedAt);
    setPerGroup(closure.qualifiersPerGroup);
    setBestNext(closure.bestNextCount);
  }
  if (!closure && syncedClosureAt !== null) {
    setSyncedClosureAt(null);
  }

  const teamName = useMemo(() => {
    const map = new Map(teamsQuery.teams.map((t) => [t.id, t.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [teamsQuery.teams]);

  const groupName = useMemo(() => {
    const map = new Map(data?.groups.map((g) => [g.group.id, g.group.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—");
  }, [data]);

  // Equipos que clasifican como mejores del siguiente puesto (para pintarlos distinto).
  const bestNextIds = useMemo(
    () =>
      new Set(
        data?.qualification?.qualified
          .filter((q) => q.via === "best_next")
          .map((q) => q.teamId),
      ),
    [data],
  );

  // Empates que siguen sin resolver dentro de cada grupo (los que afectan la
  // clasificación van primero).
  const groupTies = useMemo(() => {
    const pendingTies = data?.qualification?.pendingTies ?? [];
    const ties: GroupTie[] = [];
    for (const { group, standings } of data?.groups ?? []) {
      const byTie = new Map<number, StandingRow[]>();
      for (const row of standings) {
        if (row.tieGroup === null) continue;
        byTie.set(row.tieGroup, [...(byTie.get(row.tieGroup) ?? []), row]);
      }
      for (const [tieGroup, rows] of byTie) {
        ties.push({
          key: `${group.id}:${tieGroup}`,
          groupName: group.name,
          rows,
          affectsQualification: pendingTies.some(
            (p) =>
              p.scope === "group" &&
              p.groupId === group.id &&
              rows.some((r) => p.teamIds.includes(r.teamId)),
          ),
        });
      }
    }
    return ties.sort(
      (a, b) => Number(b.affectsQualification) - Number(a.affectsQualification),
    );
  }, [data]);

  if (isLoading || teamsQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />;
  }

  if (error || !data) {
    return (
      <Card className="border-red-100 p-6 text-center text-sm text-red-700">
        {getPhaseErrorMessage(error)}
      </Card>
    );
  }

  const { progress, qualification, manualRanks } = data;
  const groupStandings = data.groups;
  const bestNextTie = qualification?.pendingTies.find(
    (p) => p.scope === "best_next",
  );
  const nextPlace = perGroup + 1;
  const isClosed = closure !== null;

  // Requisitos para poder cerrar la fase.
  const candidates = qualification?.bestNextRanking.length ?? 0;
  const pendingTiesCount = qualification?.pendingTies.length ?? 0;
  const configOk = bestNext <= candidates;
  const canClose =
    !isClosed &&
    progress.isComplete &&
    pendingTiesCount === 0 &&
    configOk &&
    qualification !== null &&
    qualification.qualified.length > 0;

  const detail =
    bestNext > 0
      ? `${perGroup} por grupo + ${bestNext} mejores ${nextPlace}º lugares`
      : `${perGroup} por grupo`;

  function fail(err: unknown) {
    setActionError(getPhaseErrorMessage(err));
  }

  function runClose() {
    setPending(null);
    setActionError(null);
    closePhase.mutate({ perGroup, bestNext }, { onError: fail });
  }

  function runReopen() {
    setPending(null);
    setActionError(null);
    reopenPhase.mutate(undefined, { onError: fail });
  }

  async function runClear() {
    setPending(null);
    setActionError(null);
    try {
      await setRanks.mutateAsync({ scope: "group", ranks: [] });
      await setRanks.mutateAsync({ scope: "best_next", ranks: [] });
    } catch (err) {
      fail(err);
    }
  }

  // El número que se guarda es la posición de la tabla que ocupa cada equipo: así dos
  // empates distintos del mismo grupo nunca repiten número y el backend no los rechaza.
  function saveGroupTie(assignment: Map<string, number>) {
    setActionError(null);
    const ranks: { teamId: string; rank: number }[] = [];
    for (const { standings } of groupStandings) {
      for (const row of standings) {
        const chosen = assignment.get(row.teamId);
        if (chosen !== undefined) {
          ranks.push({ teamId: row.teamId, rank: chosen });
        } else if (row.resolvedManually) {
          // El backend reemplaza todo: se conservan las decisiones ya vigentes.
          ranks.push({ teamId: row.teamId, rank: row.position });
        }
      }
    }
    setRanks.mutate({ scope: "group", ranks }, { onError: fail });
  }

  function saveBestNextTie(assignment: Map<string, number>) {
    setActionError(null);
    setRanks.mutate(
      {
        scope: "best_next",
        ranks: [...assignment].map(([teamId, rank]) => ({ teamId, rank })),
      },
      { onError: fail },
    );
  }

  const confirmCopy = {
    close: {
      message: `Vas a cerrar la fase con ${qualification?.qualified.length ?? 0} clasificados (${detail}).\n\nSe guardará la lista de clasificados. Podrás reabrir la fase si te equivocas.`,
      label: "Sí, cerrar fase",
      run: runClose,
    },
    reopen: {
      message:
        "Reabrir la fase borra la lista de clasificados guardada y permite volver a editar resultados y desempates.",
      label: "Sí, reabrir fase",
      run: runReopen,
    },
    clear: {
      message:
        "¿Quitar todas las decisiones manuales de desempate de esta fase?",
      label: "Sí, quitar",
      run: runClear,
    },
  } as const;

  function renderRow(row: StandingRow) {
    const direct = row.position <= perGroup;
    const viaBest = bestNextIds.has(row.teamId);
    return (
      <tr
        key={row.teamId}
        className={`border-t border-slate-100 ${
          direct ? "bg-emerald-50/70" : viaBest ? "bg-emerald-50/40" : ""
        }`}
      >
        <td className={CELL}>{row.position}</td>
        <td className="px-2 py-1.5 text-left text-slate-800">
          <span>{teamName(row.teamId)}</span>
          {row.tieGroup !== null && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              Empate
            </span>
          )}
          {row.resolvedManually && (
            <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
              Desempate manual
            </span>
          )}
          {viaBest && (
            <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Mejor {nextPlace}º
            </span>
          )}
        </td>
        <td className={CELL}>{row.played}</td>
        <td className={CELL}>{row.won}</td>
        <td className={CELL}>{row.drawn}</td>
        <td className={CELL}>{row.lost}</td>
        <td className={CELL}>{row.goalsFor}</td>
        <td className={CELL}>{row.goalsAgainst}</td>
        <td className={CELL}>{row.goalDifference}</td>
        <td className="px-2 py-1.5 text-center font-semibold text-slate-900">
          {row.points}
        </td>
      </tr>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Posiciones y clasificación
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {progress.finishedMatches} de {progress.expectedMatches} partidos de
            grupos terminados. Desempates: puntos, diferencia de goles, goles a
            favor, enfrentamiento directo y decisión manual.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {manualRanks.length > 0 && !isClosed && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPending("clear")}
              disabled={setRanks.isPending}
            >
              Quitar desempates manuales ({manualRanks.length})
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>
      </div>

      {pending && (
        <div className="mb-5">
          <ConfirmBox
            message={confirmCopy[pending].message}
            confirmLabel={confirmCopy[pending].label}
            pending={
              closePhase.isPending ||
              reopenPhase.isPending ||
              setRanks.isPending
            }
            onConfirm={confirmCopy[pending].run}
            onCancel={() => setPending(null)}
          />
        </div>
      )}

      {closure && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">
                Fase cerrada
              </h3>
              <p className="mt-0.5 text-xs text-emerald-800">
                Cerrada el{" "}
                {new Date(closure.closedAt).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                . Clasificaron {closure.qualified.length} equipos (
                {closure.qualifiersPerGroup} por grupo
                {closure.bestNextCount > 0
                  ? ` + ${closure.bestNextCount} mejores ${closure.qualifiersPerGroup + 1}º lugares`
                  : ""}
                ).
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPending("reopen")}
              disabled={reopenPhase.isPending}
            >
              {reopenPhase.isPending ? "Reabriendo…" : "Reabrir fase"}
            </Button>
          </div>

          <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-emerald-200 bg-white">
            <table className="w-full min-w-[26rem] text-xs">
              <thead className="sticky top-0 bg-emerald-50 text-emerald-900">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Equipo</th>
                  <th className="px-2 py-2 text-left font-medium">Grupo</th>
                  <th className={HEAD}>Pos.</th>
                  <th className="px-2 py-2 text-left font-medium">Pasó como</th>
                  <th className={HEAD}>DG</th>
                  <th className={HEAD}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {closure.qualified.map((item) => (
                  <tr key={item.teamId} className="border-t border-emerald-100">
                    <td className="px-2 py-1.5 text-slate-800">
                      {teamName(item.teamId)}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600">
                      {groupName(item.groupId)}
                    </td>
                    <td className={CELL}>{item.position}º</td>
                    <td className="px-2 py-1.5 text-slate-600">
                      {item.via === "group"
                        ? "Directo"
                        : `Mejor ${item.position}º`}
                    </td>
                    <td className={CELL}>{item.goalDifference}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-slate-900">
                      {item.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Clasifican por grupo
          <input
            type="number"
            min={1}
            max={32}
            value={perGroup}
            disabled={isClosed}
            onChange={(e) =>
              setPerGroup(clamp(Number(e.target.value) || 1, 1, 32))
            }
            className={numberInput}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Mejores {nextPlace}º lugares que también pasan
          <input
            type="number"
            min={0}
            max={64}
            value={bestNext}
            disabled={isClosed}
            onChange={(e) =>
              setBestNext(clamp(Number(e.target.value) || 0, 0, 64))
            }
            className={numberInput}
          />
        </label>
        {qualification && (
          <p className="pb-2 text-xs text-slate-500">
            Clasifican {qualification.qualified.length} equipos en total.
            {isClosed && " Valores fijados por el cierre de la fase."}
          </p>
        )}
      </div>

      {groupStandings.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Esta fase aún no tiene grupos.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groupStandings.map(({ group, standings }) => (
            <div
              key={group.id}
              className="min-w-0 overflow-hidden rounded-xl border border-slate-200"
            >
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                {group.name}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[26rem] text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className={HEAD}>#</th>
                      <th className="px-2 py-2 text-left font-medium">
                        Equipo
                      </th>
                      <th className={HEAD}>PJ</th>
                      <th className={HEAD}>G</th>
                      <th className={HEAD}>E</th>
                      <th className={HEAD}>P</th>
                      <th className={HEAD}>GF</th>
                      <th className={HEAD}>GC</th>
                      <th className={HEAD}>DG</th>
                      <th className={HEAD}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-4 text-center text-slate-400"
                        >
                          Sin equipos asignados
                        </td>
                      </tr>
                    ) : (
                      standings.map(renderRow)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {qualification && qualification.bestNext > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Ranking de {nextPlace}º lugares
          </h3>
          <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[30rem] text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500">
                <tr>
                  <th className={HEAD}>#</th>
                  <th className="px-2 py-2 text-left font-medium">Equipo</th>
                  <th className="px-2 py-2 text-left font-medium">Grupo</th>
                  <th className={HEAD}>DG</th>
                  <th className={HEAD}>GF</th>
                  <th className={HEAD}>Pts</th>
                  <th className={HEAD}>Pasa</th>
                </tr>
              </thead>
              <tbody>
                {qualification.bestNextRanking.map((entry, index) => (
                  <tr
                    key={entry.teamId}
                    className={`border-t border-slate-100 ${
                      entry.qualified ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <td className={CELL}>{index + 1}</td>
                    <td className="px-2 py-1.5 text-left text-slate-800">
                      {teamName(entry.teamId)}
                    </td>
                    <td className="px-2 py-1.5 text-left text-slate-600">
                      {groupName(entry.groupId)}
                    </td>
                    <td className={CELL}>{entry.goalDifference}</td>
                    <td className={CELL}>{entry.goalsFor}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-slate-900">
                      {entry.points}
                    </td>
                    <td className={CELL}>{entry.qualified ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isClosed && (groupTies.length > 0 || bestNextTie) && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            Empates por resolver
          </h3>
          <p className="mb-3 text-xs text-amber-800">
            Siguen empatados tras todos los desempates automáticos. Elige la
            posición de cada equipo y guarda la decisión.
          </p>
          <div className="space-y-3">
            {groupTies.map((tie) => (
              <PhaseTieResolver
                key={tie.key}
                title={tie.groupName}
                affectsQualification={tie.affectsQualification}
                teams={tie.rows.map((row) => ({
                  teamId: row.teamId,
                  name: teamName(row.teamId),
                }))}
                positions={tie.rows
                  .map((row) => row.position)
                  .sort((a, b) => a - b)}
                isSaving={setRanks.isPending}
                onSave={saveGroupTie}
              />
            ))}
            {bestNextTie && qualification && (
              <PhaseTieResolver
                key="best-next"
                title={`Mejores ${nextPlace}º lugares`}
                affectsQualification
                teams={bestNextTie.teamIds.map((teamId) => ({
                  teamId,
                  name: teamName(teamId),
                }))}
                positions={bestNextTie.teamIds
                  .map(
                    (teamId) =>
                      qualification.bestNextRanking.findIndex(
                        (entry) => entry.teamId === teamId,
                      ) + 1,
                  )
                  .sort((a, b) => a - b)}
                isSaving={setRanks.isPending}
                onSave={saveBestNextTie}
              />
            )}
          </div>
        </div>
      )}

      {!isClosed && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Cierre de fase
              </h3>
              <p className="mb-2 text-xs text-slate-500">
                El cierre es manual: guarda la lista de clasificados con la
                configuración de arriba.
              </p>
              <ul className="space-y-1.5">
                <CheckItem ok={progress.isComplete}>
                  {progress.finishedMatches} de {progress.expectedMatches}{" "}
                  partidos de grupos terminados
                </CheckItem>
                <CheckItem ok={pendingTiesCount === 0}>
                  {pendingTiesCount === 0
                    ? "Sin empates pendientes que afecten la clasificación"
                    : `${pendingTiesCount} empate(s) pendiente(s) que afectan la clasificación`}
                </CheckItem>
                <CheckItem ok={configOk}>
                  {configOk
                    ? "Configuración de clasificación válida"
                    : `Pides ${bestNext} mejores ${nextPlace}º lugares, pero solo hay ${candidates} candidatos`}
                </CheckItem>
              </ul>
            </div>
            <Button
              type="button"
              onClick={() => setPending("close")}
              disabled={!canClose || closePhase.isPending}
              className="shrink-0"
            >
              {closePhase.isPending ? "Cerrando…" : "Cerrar fase"}
            </Button>
          </div>
        </div>
      )}

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}
    </Card>
  );
}
