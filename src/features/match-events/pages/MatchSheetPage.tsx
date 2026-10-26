import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Flag,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import {
  MATCH_STATUS_LABELS,
  getMatchErrorMessage,
  useFinishMatch,
  useMatch,
  useReopenMatch,
  useStartMatch,
  useUpdateMatch,
  type Match,
  type MatchStatus,
  type MatchUpdateInput,
} from "../../matches";
import { usePlayers } from "../../players";
import { useAllTeams } from "../../teams";
import {
  useCreateMatchEvent,
  useDeleteMatchEvent,
  useMatchEvents,
} from "../hooks";
import {
  EVENT_TYPES,
  EVENT_TYPE_META,
  type MatchEventInput,
  type MatchEventType,
} from "../types";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const statusBadge: Record<MatchStatus, string> = {
  scheduled: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-50 text-amber-700",
  finished: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  postponed: "bg-sky-50 text-sky-700",
};

const LIFECYCLE_MESSAGES = {
  start: "Partido iniciado: la cédula está abierta.",
  finish: "Partido finalizado: la cédula quedó cerrada.",
  reopen: "Cédula reabierta: ya puedes corregir los eventos.",
} as const;

type Message = { ok: boolean; text: string };

function EventBadge({ type }: { type: MatchEventType }) {
  const meta = EVENT_TYPE_META[type] ?? EVENT_TYPE_META.otro;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}
    >
      {type === "tarjeta_amarilla" && (
        <span className="h-3 w-2 rounded-[2px] bg-amber-400" />
      )}
      {type === "tarjeta_roja" && (
        <span className="h-3 w-2 rounded-[2px] bg-red-500" />
      )}
      {meta.label}
    </span>
  );
}

function MatchSheet({ match }: { match: Match }) {
  const tournamentId = match.tournamentId;

  const teamsQuery = useAllTeams(tournamentId, {
    categoryId: match.categoryId,
  });
  const eventsQuery = useMatchEvents(match.id);
  const homePlayersQuery = usePlayers(tournamentId, {
    teamId: match.homeTeamId,
    limit: 100,
  });
  const awayPlayersQuery = usePlayers(tournamentId, {
    teamId: match.awayTeamId,
    limit: 100,
  });

  const startMatch = useStartMatch(tournamentId);
  const finishMatch = useFinishMatch(tournamentId);
  const reopenMatch = useReopenMatch(tournamentId);
  const updateMatch = useUpdateMatch(tournamentId);
  const createEvent = useCreateMatchEvent(tournamentId, match.id);
  const deleteEvent = useDeleteMatchEvent(tournamentId, match.id);

  const [teamId, setTeamId] = useState(match.homeTeamId);
  const [eventType, setEventType] = useState<MatchEventType>("gol");
  const [playerId, setPlayerId] = useState("");
  // Solo para cambios: el jugador que entra (playerId es el que sale).
  const [substituteId, setSubstituteId] = useState("");
  const [minute, setMinute] = useState("");
  const [description, setDescription] = useState("");
  const [homePen, setHomePen] = useState(
    match.homePenalties != null ? String(match.homePenalties) : "",
  );
  const [awayPen, setAwayPen] = useState(
    match.awayPenalties != null ? String(match.awayPenalties) : "",
  );
  const [message, setMessage] = useState<Message | null>(null);

  // Mismo clientEventId mientras se reintente el mismo evento; cambia si se edita el formulario.
  const clientEventIdRef = useRef<string | null>(null);
  const resetClientEventId = () => {
    clientEventIdRef.current = null;
  };

  const status = match.status;
  const isLive = status === "in_progress";
  const isFinished = status === "finished";
  const canStart = status === "scheduled" || status === "postponed";
  const isSubstitution = eventType === "cambio";
  const isOther = eventType === "otro";
  const isBusy =
    startMatch.isPending ||
    finishMatch.isPending ||
    reopenMatch.isPending ||
    updateMatch.isPending;

  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  const showPenalties = (isLive || isFinished) && homeScore === awayScore;

  const teamName = useMemo(
    () => new Map(teamsQuery.teams.map((t) => [t.id, t.name])),
    [teamsQuery.teams],
  );
  const homeName = teamName.get(match.homeTeamId) ?? "Local";
  const awayName = teamName.get(match.awayTeamId) ?? "Visitante";

  const homePlayers = homePlayersQuery.players;
  const awayPlayers = awayPlayersQuery.players;
  const teamPlayers = teamId === match.homeTeamId ? homePlayers : awayPlayers;
  const loadingPlayers =
    teamId === match.homeTeamId
      ? homePlayersQuery.isLoading
      : awayPlayersQuery.isLoading;

  const playerLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of [...homePlayers, ...awayPlayers]) {
      const number = p.number != null ? `#${p.number} ` : "";
      map.set(p.id, `${number}${p.firstName} ${p.lastName}`);
    }
    return map;
  }, [homePlayers, awayPlayers]);

  const events = useMemo(
    () =>
      [...eventsQuery.events].sort(
        (a, b) => (a.minute ?? 9999) - (b.minute ?? 9999),
      ),
    [eventsQuery.events],
  );

  const backTo = match.phaseId
    ? { to: `/phases/${match.phaseId}/results`, label: "Resultados de la fase" }
    : { to: "/calendar", label: "Calendario" };

  const scheduled = new Date(match.scheduledAt).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function runLifecycle(action: "start" | "finish" | "reopen") {
    setMessage(null);
    const mutation = {
      start: startMatch,
      finish: finishMatch,
      reopen: reopenMatch,
    }[action];
    try {
      await mutation.mutateAsync(match.id);
      setMessage({ ok: true, text: LIFECYCLE_MESSAGES[action] });
    } catch (err) {
      setMessage({ ok: false, text: getMatchErrorMessage(err) });
    }
  }

  async function handleAddEvent(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (isSubstitution && (!playerId || !substituteId)) {
      setMessage({
        ok: false,
        text: "Selecciona el jugador que sale y el que entra.",
      });
      return;
    }
    if (isOther && description.trim() === "") {
      setMessage({ ok: false, text: "Describe brevemente el evento." });
      return;
    }

    const parsedMinute =
      minute.trim() === "" ? undefined : Number.parseInt(minute, 10);
    if (
      parsedMinute !== undefined &&
      (Number.isNaN(parsedMinute) || parsedMinute < 0)
    ) {
      setMessage({ ok: false, text: "El minuto debe ser un número positivo." });
      return;
    }

    if (!clientEventIdRef.current) {
      clientEventIdRef.current = crypto.randomUUID();
    }

    const payload: MatchEventInput = {
      eventType,
      teamId,
      clientEventId: clientEventIdRef.current,
      ...(playerId ? { playerId } : {}),
      ...(isSubstitution ? { substitutePlayerId: substituteId } : {}),
      ...(parsedMinute !== undefined ? { minute: parsedMinute } : {}),
      ...(isOther ? { description: description.trim() } : {}),
    };

    try {
      await createEvent.mutateAsync(payload);
      resetClientEventId();
      setPlayerId("");
      setSubstituteId("");
      setMinute("");
      setDescription("");
    } catch (err) {
      setMessage({ ok: false, text: getMatchErrorMessage(err) });
    }
  }

  async function handleDeleteEvent(eventId: string) {
    setMessage(null);
    try {
      await deleteEvent.mutateAsync(eventId);
    } catch (err) {
      setMessage({ ok: false, text: getMatchErrorMessage(err) });
    }
  }

  async function savePenalties(clear: boolean) {
    setMessage(null);

    let input: MatchUpdateInput;
    if (clear) {
      input = { homePenalties: null, awayPenalties: null };
    } else {
      const home = Number.parseInt(homePen, 10);
      const away = Number.parseInt(awayPen, 10);
      if (Number.isNaN(home) || Number.isNaN(away) || home < 0 || away < 0) {
        setMessage({
          ok: false,
          text: "Captura los penales de ambos equipos (números enteros).",
        });
        return;
      }
      input = { homePenalties: home, awayPenalties: away };
    }

    try {
      await updateMatch.mutateAsync({ id: match.id, input });
      if (clear) {
        setHomePen("");
        setAwayPen("");
      }
      setMessage({
        ok: true,
        text: clear ? "Penales eliminados." : "Penales guardados.",
      });
    } catch (err) {
      setMessage({ ok: false, text: getMatchErrorMessage(err) });
    }
  }

  const sideLabel = teamId === match.homeTeamId ? "Local" : "Visitante";

  return (
    <div>
      <Link
        to={backTo.to}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        {backTo.label}
      </Link>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[status]}`}
          >
            {MATCH_STATUS_LABELS[status]}
          </span>
          <p className="text-xs text-slate-500">
            {scheduled}
            {match.venue ? ` · ${match.venue}` : ""}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <p className="min-w-0 break-words text-right text-base font-bold text-slate-900 sm:text-xl">
            {homeName}
          </p>
          <p className="rounded-xl bg-slate-900 px-4 py-2 text-2xl font-bold tabular-nums text-white sm:text-3xl">
            {homeScore} - {awayScore}
          </p>
          <p className="min-w-0 break-words text-base font-bold text-slate-900 sm:text-xl">
            {awayName}
          </p>
        </div>

        {showPenalties &&
          match.homePenalties != null &&
          match.awayPenalties != null && (
            <p className="mt-3 text-center text-sm text-slate-500">
              Penales: {match.homePenalties} - {match.awayPenalties}
            </p>
          )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {canStart && (
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => runLifecycle("start")}
            >
              <Play size={16} />
              Iniciar partido
            </Button>
          )}
          {isLive && (
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => runLifecycle("finish")}
            >
              <Flag size={16} />
              Finalizar partido
            </Button>
          )}
          {isFinished && (
            <Button
              type="button"
              variant="secondary"
              disabled={isBusy}
              onClick={() => runLifecycle("reopen")}
            >
              <RotateCcw size={16} />
              Reabrir cédula
            </Button>
          )}
          <p className="text-xs text-slate-500">
            {canStart && "Inicia el partido para abrir la cédula."}
            {isLive && "Cédula abierta: registra los eventos del partido."}
            {isFinished && "Cédula cerrada. Reábrela para corregir eventos."}
          </p>
        </div>
      </Card>

      {message && (
        <p
          role="status"
          className={`mb-6 rounded-lg px-3 py-2 text-sm ${
            message.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Eventos ({events.length})
            </h2>

            {eventsQuery.isLoading ? (
              <div className="mt-4 h-24 animate-pulse rounded-lg bg-slate-100" />
            ) : events.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Sin eventos"
                description={
                  isLive
                    ? "Registra el primer evento con el formulario."
                    : "Cuando el partido esté en curso podrás registrar goles, tarjetas y cambios."
                }
              />
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {events.map((event) => {
                  const isHome = event.teamId === match.homeTeamId;
                  const isDerived = Boolean(event.derivedFromEventId);
                  const player = event.playerId
                    ? playerLabel.get(event.playerId)
                    : null;
                  const substitute = event.substitutePlayerId
                    ? playerLabel.get(event.substitutePlayerId)
                    : null;

                  return (
                    <li
                      key={event.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span className="w-10 shrink-0 text-sm font-semibold tabular-nums text-slate-500">
                        {event.minute != null ? `${event.minute}'` : "—"}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <EventBadge type={event.eventType} />
                        <p className="truncate text-sm font-medium text-slate-900">
                          {event.eventType === "cambio"
                            ? `Sale: ${player ?? "—"}`
                            : event.eventType === "otro"
                              ? (event.description ?? "Sin descripción")
                              : (player ?? "Jugador sin asignar")}
                        </p>
                        {event.eventType === "cambio" && (
                          <p className="truncate text-xs text-slate-600">
                            Entra: {substitute ?? "—"}
                          </p>
                        )}
                        <p className="truncate text-xs text-slate-500">
                          {isHome ? homeName : awayName} (
                          {isHome ? "Local" : "Visitante"})
                          {isDerived && event.description
                            ? ` · ${event.description}`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={!isLive || isDerived || deleteEvent.isPending}
                        title={
                          isDerived
                            ? "Se elimina al borrar la segunda amarilla"
                            : isLive
                              ? "Eliminar evento"
                              : "Reabre la cédula para borrar"
                        }
                        aria-label="Eliminar evento"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="order-first min-w-0 space-y-6 lg:order-none">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Registrar evento
            </h2>

            <form onSubmit={handleAddEvent} className="mt-4">
              <fieldset
                disabled={!isLive}
                className="space-y-4 disabled:opacity-50"
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: match.homeTeamId, label: homeName },
                    { id: match.awayTeamId, label: awayName },
                  ].map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      aria-pressed={teamId === team.id}
                      onClick={() => {
                        setTeamId(team.id);
                        setPlayerId("");
                        setSubstituteId("");
                        resetClientEventId();
                      }}
                      className={`truncate rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        teamId === team.id
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {team.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="event-type"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Tipo
                  </label>
                  <select
                    id="event-type"
                    value={eventType}
                    onChange={(e) => {
                      setEventType(e.target.value as MatchEventType);
                      setSubstituteId("");
                      setDescription("");
                      resetClientEventId();
                    }}
                    className={inputClass}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {EVENT_TYPE_META[type].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="event-player"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {isSubstitution ? "Sale" : "Jugador"} ({sideLabel}){" "}
                    {!isSubstitution && (
                      <span className="font-normal text-slate-400">
                        (opcional)
                      </span>
                    )}
                  </label>
                  <select
                    id="event-player"
                    value={playerId}
                    onChange={(e) => {
                      setPlayerId(e.target.value);
                      if (e.target.value === substituteId) setSubstituteId("");
                      resetClientEventId();
                    }}
                    className={inputClass}
                  >
                    <option value="">
                      {loadingPlayers
                        ? "Cargando jugadores…"
                        : isSubstitution
                          ? "Selecciona quién sale"
                          : "Sin jugador"}
                    </option>
                    {teamPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {playerLabel.get(p.id)}
                      </option>
                    ))}
                  </select>
                  {!loadingPlayers && teamPlayers.length === 0 && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Este equipo no tiene jugadores registrados.
                    </p>
                  )}
                </div>

                {isSubstitution && (
                  <div>
                    <label
                      htmlFor="event-substitute"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Entra ({sideLabel})
                    </label>
                    <select
                      id="event-substitute"
                      value={substituteId}
                      onChange={(e) => {
                        setSubstituteId(e.target.value);
                        resetClientEventId();
                      }}
                      className={inputClass}
                    >
                      <option value="">Selecciona quién entra</option>
                      {teamPlayers
                        .filter((p) => p.id !== playerId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {playerLabel.get(p.id)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {isOther && (
                  <div>
                    <label
                      htmlFor="event-description"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Descripción
                    </label>
                    <input
                      id="event-description"
                      type="text"
                      maxLength={200}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        resetClientEventId();
                      }}
                      placeholder="Ej. Lesión, reclamo, pausa"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="event-minute"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Minuto{" "}
                    <span className="font-normal text-slate-400">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="event-minute"
                    type="number"
                    min={0}
                    max={150}
                    value={minute}
                    onChange={(e) => {
                      setMinute(e.target.value);
                      resetClientEventId();
                    }}
                    className={inputClass}
                  />
                </div>

                {eventType === "autogol" && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    El autogol suma al rival: elige el equipo del jugador que lo
                    cometió.
                  </p>
                )}
                {eventType === "tarjeta_amarilla" && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    La segunda amarilla del mismo jugador genera la roja
                    automáticamente.
                  </p>
                )}
                {isSubstitution && (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Un cambio necesita al jugador que sale y al que entra,
                    distintos y del mismo equipo.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={createEvent.isPending}
                  className="w-full"
                >
                  {createEvent.isPending ? "Registrando…" : "Registrar"}
                </Button>
              </fieldset>
            </form>
          </Card>

          {showPenalties && (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">
                Penales
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                El marcador está empatado. Si se definió por penales,
                captúralos.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="home-pen"
                    className="mb-1.5 block truncate text-xs font-medium text-slate-600"
                  >
                    {homeName}
                  </label>
                  <input
                    id="home-pen"
                    type="number"
                    min={0}
                    value={homePen}
                    onChange={(e) => setHomePen(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="away-pen"
                    className="mb-1.5 block truncate text-xs font-medium text-slate-600"
                  >
                    {awayName}
                  </label>
                  <input
                    id="away-pen"
                    type="number"
                    min={0}
                    value={awayPen}
                    onChange={(e) => setAwayPen(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isBusy || homePen === "" || awayPen === ""}
                  onClick={() => savePenalties(false)}
                >
                  Guardar penales
                </Button>
                {(match.homePenalties != null ||
                  match.awayPenalties != null) && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={() => savePenalties(true)}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

export function MatchSheetPage() {
  const { id } = useParams<{ id: string }>();
  const { match, isLoading } = useMatch(id);

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-slate-200/70" />
        <div className="mb-6 h-48 animate-pulse rounded-xl bg-slate-200/70" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!match) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
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

  // key: al cambiar de partido se reinicia todo el estado de la cédula.
  return <MatchSheet key={match.id} match={match} />;
}
