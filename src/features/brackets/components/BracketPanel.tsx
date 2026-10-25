import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { ConfirmBox } from "../../../shared/components/ui/ConfirmBox";
import { useAllMatches } from "../../matches";
import { usePhases, type Phase } from "../../phases";
import type { Team } from "../../teams";
import { useBracket, useDeleteBracket, useGenerateBracket } from "../hooks";
import type { BracketNode } from "../types";
import { getBracketErrorMessage } from "../utils/errors";
import {
  buildRoundSizes,
  describeSource,
  mainRoundLabel,
  nodeStageLabel,
} from "../utils/labels";
import { BracketNodeCard } from "./BracketNodeCard";

interface Column {
  key: string;
  title: string;
  nodes: BracketNode[];
}

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function GenerateForm({
  phase,
  hasBracket,
}: {
  phase: Phase;
  hasBracket: boolean;
}) {
  const { phases } = usePhases(phase.tournamentId, phase.categoryId);
  const generate = useGenerateBracket(phase.tournamentId, phase.id);

  const [sourceId, setSourceId] = useState("");
  const [thirdPlace, setThirdPlace] = useState(true);
  const [twoLegged, setTwoLegged] = useState(false);
  const [singleLegFinal, setSingleLegFinal] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo fases de grupos de esta categoría; las cerradas son las que se pueden usar.
  const sources = phases.filter((p) => p.type === "group");
  const firstClosed = sources.find((p) => p.status === "finished");
  const selected = sourceId || firstClosed?.id || "";

  function run() {
    setConfirming(false);
    setError(null);
    generate.mutate(
      {
        sourcePhaseId: selected,
        thirdPlace,
        twoLegged,
        // Solo tiene sentido con ida y vuelta.
        ...(twoLegged ? { singleLegFinal } : {}),
      },
      { onError: (err) => setError(getBracketErrorMessage(err)) },
    );
  }

  const label = hasBracket ? "Regenerar llave" : "Generar llave";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
      <p className="mb-3 text-xs text-slate-500">
        Los clasificados salen de una fase de grupos cerrada. Se ordenan por
        posición, puntos, diferencia y goles a favor, y se cruzan mejor contra
        peor.
      </p>

      {sources.length === 0 ? (
        <p className="text-sm text-slate-500">
          Esta categoría no tiene una fase de grupos.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Fase de grupos de origen
              <select
                value={selected}
                onChange={(e) => setSourceId(e.target.value)}
                className={selectClass}
              >
                {!firstClosed && <option value="">Sin fases cerradas</option>}
                {sources.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={p.status !== "finished"}
                  >
                    {p.name}
                    {p.status !== "finished" ? " (sin cerrar)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              onClick={() => (hasBracket ? setConfirming(true) : run())}
              disabled={!selected || generate.isPending}
            >
              {generate.isPending ? "Generando…" : label}
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={thirdPlace}
                onChange={(e) => setThirdPlace(e.target.checked)}
              />
              Partido por el tercer lugar
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={twoLegged}
                onChange={(e) => setTwoLegged(e.target.checked)}
              />
              Cruces a ida y vuelta
            </label>
            {twoLegged && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={singleLegFinal}
                  onChange={(e) => setSingleLegFinal(e.target.checked)}
                />
                Final a partido único
              </label>
            )}
          </div>
          {twoLegged && (
            <p className="text-xs text-slate-500">
              Gana el marcador global; si empata, se define por penales (sin gol
              de visitante). El repechaje y el tercer lugar siguen siendo a
              partido único.
            </p>
          )}
        </div>
      )}

      {!firstClosed && sources.length > 0 && (
        <p className="mt-2 text-xs text-amber-700">
          Cierra primero la fase de grupos para poder generar la llave.
        </p>
      )}

      {confirming && (
        <div className="mt-3">
          <ConfirmBox
            message="Se reemplazará la llave actual por una nueva."
            confirmLabel="Sí, regenerar"
            onConfirm={run}
            onCancel={() => setConfirming(false)}
          />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function BracketPanel({
  phase,
  teams,
}: {
  phase: Phase;
  teams: Team[];
}) {
  const tournamentId = phase.tournamentId;

  const bracket = useBracket(tournamentId, phase.id);
  const matchesQuery = useAllMatches(tournamentId, { phaseId: phase.id });
  const deleteBracket = useDeleteBracket(tournamentId, phase.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { nodes } = bracket;

  const teamName = useMemo(() => {
    const map = new Map(teams.map((t) => [t.id, t.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [teams]);

  const matchById = useMemo(
    () => new Map(matchesQuery.matches.map((m) => [m.id, m])),
    [matchesQuery.matches],
  );

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const roundSizes = useMemo(() => buildRoundSizes(nodes), [nodes]);

  // Columnas: repechaje, una por ronda del cuadro principal y, junto a la final, el tercer lugar.
  const columns = useMemo<Column[]>(() => {
    const playIn = nodes.filter((n) => n.stage === "play_in");
    const main = nodes.filter((n) => n.stage === "main");
    const third = nodes.filter((n) => n.stage === "third_place");
    const rounds = [...new Set(main.map((n) => n.round))].sort((a, b) => a - b);
    const lastRound = rounds[rounds.length - 1];

    const result: Column[] = [];
    if (playIn.length > 0) {
      result.push({ key: "play_in", title: "Repechaje", nodes: playIn });
    }
    for (const round of rounds) {
      const inRound = main
        .filter((n) => n.round === round)
        .sort((a, b) => a.position - b.position);
      result.push({
        key: `round-${round}`,
        title: mainRoundLabel(roundSizes.get(round) ?? 0),
        nodes: round === lastRound ? [...inRound, ...third] : inRound,
      });
    }
    return result;
  }, [nodes, roundSizes]);

  // Regenerar o eliminar solo se ofrece mientras ningún cruce tenga partidos (ida o vuelta).
  const started = nodes.some(
    (n) => n.matchId !== null || n.secondLegMatchId !== null,
  );

  const finalNode = nodes
    .filter((n) => n.stage === "main")
    .sort((a, b) => b.round - a.round)[0];
  const champion =
    finalNode?.winnerTeamId && columns.length > 0
      ? teamName(finalNode.winnerTeamId)
      : null;

  function handleDelete() {
    setConfirmDelete(false);
    setDeleteError(null);
    deleteBracket.mutate(undefined, {
      onError: (err) => setDeleteError(getBracketErrorMessage(err)),
    });
  }

  if (bracket.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />;
  }

  if (bracket.error) {
    return (
      <Card className="border-red-100 p-6 text-center text-sm text-red-700">
        {getBracketErrorMessage(bracket.error)}
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Llave</h2>
        <p className="mt-1 text-sm text-slate-500">
          Programa cada cruce cuando ya tenga sus dos equipos y captura su
          resultado desde la cédula: el ganador avanza solo a la siguiente
          ronda.
        </p>
      </div>

      {champion && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <Trophy size={22} className="mx-auto text-amber-600" />
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Campeón
          </p>
          <p className="text-xl font-bold text-amber-900">{champion}</p>
        </div>
      )}

      {nodes.length === 0 ? (
        <GenerateForm phase={phase} hasBracket={false} />
      ) : (
        <>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {columns.map((column) => (
                <div key={column.key} className="w-72 shrink-0">
                  <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {column.title}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {column.nodes.map((node) => (
                      <BracketNodeCard
                        key={node.id}
                        tournamentId={tournamentId}
                        phaseId={phase.id}
                        node={node}
                        title={nodeStageLabel(node, roundSizes)}
                        homePlaceholder={describeSource(
                          node.homeSource,
                          nodeById,
                          roundSizes,
                        )}
                        awayPlaceholder={describeSource(
                          node.awaySource,
                          nodeById,
                          roundSizes,
                        )}
                        teamName={teamName}
                        firstMatch={
                          node.matchId ? matchById.get(node.matchId) : undefined
                        }
                        secondMatch={
                          node.secondLegMatchId
                            ? matchById.get(node.secondLegMatchId)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!started && (
            <div className="mt-6 space-y-4">
              <GenerateForm phase={phase} hasBracket />

              <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">
                      Eliminar llave
                    </h3>
                    <p className="text-xs text-red-700/80">
                      Hazlo si necesitas reabrir la fase de grupos: mientras
                      exista la llave, esa fase no se puede reabrir.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleteBracket.isPending}
                    className="shrink-0 text-red-600"
                  >
                    {deleteBracket.isPending ? "Eliminando…" : "Eliminar llave"}
                  </Button>
                </div>
                {confirmDelete && (
                  <div className="mt-3">
                    <ConfirmBox
                      message="Se eliminará la llave. Podrás generarla de nuevo cuando quieras."
                      confirmLabel="Sí, eliminar"
                      onConfirm={handleDelete}
                      onCancel={() => setConfirmDelete(false)}
                    />
                  </div>
                )}
              </div>
              {deleteError && (
                <p className="text-sm text-red-600">{deleteError}</p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
