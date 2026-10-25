import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import {
  MATCH_STATUS_LABELS,
  datetimeLocalToIso,
  type Match,
} from "../../matches";
import { useScheduleBracketNode, useSetBracketNodePenalties } from "../hooks";
import type { BracketNode } from "../types";
import { getBracketErrorMessage } from "../utils/errors";

const cleanScore = (value: string) => value.replace(/\D/g, "").slice(0, 2);

const BTN =
  "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50";
const BTN_PRIMARY =
  "inline-flex min-h-8 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50";
const BTN_DANGER =
  "inline-flex min-h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50";
const FIELD =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const PEN_FIELD =
  "w-14 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

type Mode = { kind: "schedule"; leg: 1 | 2 } | { kind: "penalties" } | null;

type Goals = { home: number; away: number };

function goalsOf(leg: 1 | 2, match: Match | undefined): Goals | null {
  if (!match || match.homeScore == null || match.awayScore == null) return null;
  return leg === 1
    ? { home: match.homeScore, away: match.awayScore }
    : { home: match.awayScore, away: match.homeScore };
}

function formatDate(match: Match): string {
  const date = new Date(match.scheduledAt).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return match.venue ? `${date} · ${match.venue}` : date;
}

interface TeamRowProps {
  name: string | null;
  placeholder: string;
  seed: number | null;
  isWinner: boolean;
  cells: Array<number | null>;
  penalties: number | null | undefined;
}

function TeamRow({
  name,
  placeholder,
  seed,
  isWinner,
  cells,
  penalties,
}: TeamRowProps) {
  const empty = cells.length > 1 ? "·" : "";
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${
        isWinner ? "bg-emerald-50" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {seed !== null && (
          <span className="shrink-0 text-[10px] font-semibold text-slate-400">
            #{seed}
          </span>
        )}
        <span
          className={`truncate text-sm ${
            name === null
              ? "italic text-slate-400"
              : isWinner
                ? "font-semibold text-slate-900"
                : "text-slate-700"
          }`}
        >
          {name ?? placeholder}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-sm tabular-nums">
        {cells.map((value, index) => (
          <span
            key={index}
            className={`w-6 text-right ${
              isWinner && index === cells.length - 1
                ? "font-bold text-slate-900"
                : "text-slate-600"
            }`}
          >
            {value ?? empty}
          </span>
        ))}
        {penalties != null && (
          <span className="text-xs text-slate-400">({penalties})</span>
        )}
      </div>
    </div>
  );
}

function ScheduleForm({
  tournamentId,
  phaseId,
  nodeId,
  leg,
  twoLegged,
  onDone,
}: {
  tournamentId: string;
  phaseId: string;
  nodeId: string;
  leg: 1 | 2;
  twoLegged: boolean;
  onDone: () => void;
}) {
  const schedule = useScheduleBracketNode(tournamentId, phaseId);
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    schedule.mutate(
      {
        nodeId,
        payload: {
          leg,
          scheduledAt: datetimeLocalToIso(scheduledAt),
          ...(venue.trim() ? { venue: venue.trim() } : {}),
        },
      },
      {
        onSuccess: onDone,
        onError: (err) => setError(getBracketErrorMessage(err)),
      },
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      <p className="text-xs font-medium text-slate-600">
        {twoLegged
          ? leg === 1
            ? "Programar partido de ida"
            : "Programar partido de vuelta"
          : "Programar partido"}
      </p>
      <div>
        <label className="text-[11px] text-slate-500">Fecha y hora *</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className={FIELD}
        />
      </div>
      <div>
        <label className="text-[11px] text-slate-500">Sede (opcional)</label>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="Cancha o estadio"
          className={FIELD}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={scheduledAt.trim() === "" || schedule.isPending}
          className={BTN_PRIMARY}
        >
          {schedule.isPending ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onDone} className={BTN}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function PenaltiesForm({
  tournamentId,
  phaseId,
  node,
  homeName,
  awayName,
  onDone,
}: {
  tournamentId: string;
  phaseId: string;
  node: BracketNode;
  homeName: string;
  awayName: string;
  onDone: () => void;
}) {
  const save = useSetBracketNodePenalties(tournamentId, phaseId);
  const [home, setHome] = useState(
    node.homePenalties != null ? String(node.homePenalties) : "",
  );
  const [away, setAway] = useState(
    node.awayPenalties != null ? String(node.awayPenalties) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const canSave = home !== "" && away !== "" && home !== away;
  const hasPenalties = node.homePenalties != null;

  function submit(homePenalties: number | null, awayPenalties: number | null) {
    setError(null);
    save.mutate(
      { nodeId: node.id, payload: { homePenalties, awayPenalties } },
      {
        onSuccess: onDone,
        onError: (err) => setError(getBracketErrorMessage(err)),
      },
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      <p className="text-xs font-medium text-slate-600">
        Penales del cruce: {homeName} vs {awayName}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={home}
          onChange={(e) => setHome(cleanScore(e.target.value))}
          className={PEN_FIELD}
        />
        <span className="text-slate-400">-</span>
        <input
          type="text"
          inputMode="numeric"
          value={away}
          onChange={(e) => setAway(cleanScore(e.target.value))}
          className={PEN_FIELD}
        />
      </div>
      {!canSave && (
        <p className="text-xs text-amber-600">
          Captura ambos marcadores de penales (no pueden quedar iguales).
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit(Number(home), Number(away))}
          disabled={!canSave || save.isPending}
          className={BTN_PRIMARY}
        >
          {save.isPending ? "Guardando…" : "Guardar penales"}
        </button>
        {hasPenalties && (
          <button
            type="button"
            onClick={() => submit(null, null)}
            disabled={save.isPending}
            className={BTN_DANGER}
          >
            Quitar penales
          </button>
        )}
        <button type="button" onClick={onDone} className={BTN}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

interface BracketNodeCardProps {
  tournamentId: string;
  phaseId: string;
  node: BracketNode;
  title: string;
  homePlaceholder: string;
  awayPlaceholder: string;
  teamName: (id: string) => string;
  firstMatch: Match | undefined;
  secondMatch: Match | undefined;
}

export function BracketNodeCard({
  tournamentId,
  phaseId,
  node,
  title,
  homePlaceholder,
  awayPlaceholder,
  teamName,
  firstMatch,
  secondMatch,
}: BracketNodeCardProps) {
  const [mode, setMode] = useState<Mode>(null);

  const twoLegged = node.legs === 2;
  const ready = node.homeTeamId !== null && node.awayTeamId !== null;
  const homeName = node.homeTeamId
    ? teamName(node.homeTeamId)
    : homePlaceholder;
  const awayName = node.awayTeamId
    ? teamName(node.awayTeamId)
    : awayPlaceholder;

  const firstGoals = goalsOf(1, firstMatch);
  const secondGoals = twoLegged ? goalsOf(2, secondMatch) : null;
  const aggregate =
    twoLegged &&
    firstMatch?.status === "finished" &&
    secondMatch?.status === "finished" &&
    firstGoals &&
    secondGoals
      ? {
          home: firstGoals.home + secondGoals.home,
          away: firstGoals.away + secondGoals.away,
        }
      : null;
  const aggregateTied = aggregate !== null && aggregate.home === aggregate.away;

  const singleDrawPending =
    !twoLegged &&
    firstMatch?.status === "finished" &&
    firstMatch.homeScore != null &&
    firstMatch.homeScore === firstMatch.awayScore &&
    node.winnerTeamId === null;

  const homeCells = twoLegged
    ? [
        firstGoals?.home ?? null,
        secondGoals?.home ?? null,
        aggregate?.home ?? null,
      ]
    : [firstMatch?.homeScore ?? null];
  const awayCells = twoLegged
    ? [
        firstGoals?.away ?? null,
        secondGoals?.away ?? null,
        aggregate?.away ?? null,
      ]
    : [firstMatch?.awayScore ?? null];

  const homePenalties = twoLegged
    ? node.homePenalties
    : firstMatch?.homePenalties;
  const awayPenalties = twoLegged
    ? node.awayPenalties
    : firstMatch?.awayPenalties;

  let statusLabel: string;
  let statusStyle: string;
  if (!ready) {
    statusLabel = "Por definir";
    statusStyle = "bg-slate-100 text-slate-500";
  } else if (node.winnerTeamId) {
    statusLabel = "Finalizado";
    statusStyle = "bg-emerald-50 text-emerald-700";
  } else if (aggregateTied || singleDrawPending) {
    statusLabel = "Faltan penales";
    statusStyle = "bg-amber-50 text-amber-700";
  } else if (!firstMatch) {
    statusLabel = "Sin programar";
    statusStyle = "bg-amber-50 text-amber-700";
  } else if (twoLegged && !secondMatch) {
    statusLabel = "Falta la vuelta";
    statusStyle = "bg-sky-50 text-sky-700";
  } else {
    statusLabel = MATCH_STATUS_LABELS[firstMatch.status] ?? "Programado";
    statusStyle = "bg-sky-50 text-sky-700";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">
          {title}
          {node.stage !== "third_place" && ` ${node.position + 1}`}
          {twoLegged && " · ida y vuelta"}
        </span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      {twoLegged && (
        <div className="flex justify-end gap-1.5 px-2 text-[10px] text-slate-400">
          <span className="w-6 text-right">Ida</span>
          <span className="w-6 text-right">Vta</span>
          <span className="w-6 text-right">Glob</span>
        </div>
      )}

      <TeamRow
        name={node.homeTeamId ? teamName(node.homeTeamId) : null}
        placeholder={homePlaceholder}
        seed={node.homeSeed}
        cells={homeCells}
        penalties={homePenalties}
        isWinner={
          node.winnerTeamId !== null && node.winnerTeamId === node.homeTeamId
        }
      />
      <TeamRow
        name={node.awayTeamId ? teamName(node.awayTeamId) : null}
        placeholder={awayPlaceholder}
        seed={node.awaySeed}
        cells={awayCells}
        penalties={awayPenalties}
        isWinner={
          node.winnerTeamId !== null && node.winnerTeamId === node.awayTeamId
        }
      />

      {(firstMatch || secondMatch) && (
        <div className="mt-2 space-y-0.5 text-[11px] text-slate-500">
          {firstMatch && (
            <p>
              {twoLegged && <span className="font-medium">Ida: </span>}
              {formatDate(firstMatch)}
            </p>
          )}
          {secondMatch && (
            <p>
              <span className="font-medium">Vuelta: </span>
              {formatDate(secondMatch)}
            </p>
          )}
        </div>
      )}

      {singleDrawPending && firstMatch && (
        <p className="mt-2 text-[11px] text-amber-700">
          Empate: captura los penales en la cédula del partido.
        </p>
      )}

      {mode === null && ready && (
        <div className="mt-2 flex flex-wrap gap-2">
          {!firstMatch ? (
            <button
              type="button"
              onClick={() => setMode({ kind: "schedule", leg: 1 })}
              className={BTN}
            >
              {twoLegged ? "Programar ida" : "Programar partido"}
            </button>
          ) : (
            <Link to={`/matches/${firstMatch.id}`} className={BTN}>
              <ClipboardList size={13} />
              {twoLegged ? "Cédula ida" : "Cédula y resultado"}
            </Link>
          )}

          {twoLegged && firstMatch && !secondMatch && (
            <button
              type="button"
              onClick={() => setMode({ kind: "schedule", leg: 2 })}
              className={BTN}
            >
              Programar vuelta
            </button>
          )}
          {twoLegged && secondMatch && (
            <Link to={`/matches/${secondMatch.id}`} className={BTN}>
              <ClipboardList size={13} />
              Cédula vuelta
            </Link>
          )}

          {twoLegged && (aggregateTied || node.homePenalties != null) && (
            <button
              type="button"
              onClick={() => setMode({ kind: "penalties" })}
              className={BTN}
            >
              {node.homePenalties != null
                ? "Editar penales"
                : "Penales del cruce"}
            </button>
          )}
        </div>
      )}

      {mode?.kind === "schedule" && (
        <ScheduleForm
          tournamentId={tournamentId}
          phaseId={phaseId}
          nodeId={node.id}
          leg={mode.leg}
          twoLegged={twoLegged}
          onDone={() => setMode(null)}
        />
      )}
      {mode?.kind === "penalties" && (
        <PenaltiesForm
          tournamentId={tournamentId}
          phaseId={phaseId}
          node={node}
          homeName={homeName}
          awayName={awayName}
          onDone={() => setMode(null)}
        />
      )}
    </div>
  );
}
