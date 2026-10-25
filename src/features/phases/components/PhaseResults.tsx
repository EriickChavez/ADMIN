import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import {
  MATCH_STATUS_LABELS,
  useAllMatches,
  type MatchStatus,
} from "../../matches";
import { useAllTeams } from "../../teams";
import { usePhaseGroups } from "../hooks";
import type { Phase } from "../types";

const statusBadge: Record<MatchStatus, string> = {
  scheduled: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-50 text-amber-700",
  finished: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  postponed: "bg-sky-50 text-sky-700",
};

const selectClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function PhaseResults({ phase }: { phase: Phase }) {
  const groupsQuery = usePhaseGroups(
    phase.type === "group" ? phase.id : undefined,
  );
  const teamsQuery = useAllTeams(phase.tournamentId, {
    categoryId: phase.categoryId,
  });
  const matchesQuery = useAllMatches(phase.tournamentId, { phaseId: phase.id });

  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "">("");

  const { groups } = groupsQuery;
  const { matches } = matchesQuery;

  const teamName = useMemo(
    () => new Map(teamsQuery.teams.map((t) => [t.id, t.name])),
    [teamsQuery.teams],
  );
  const groupName = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups],
  );

  const sorted = useMemo(() => {
    const order = new Map(groups.map((g, i) => [g.id, i]));
    return [...matches].sort((a, b) => {
      const ga = order.get(a.phaseGroupId ?? "") ?? -1;
      const gb = order.get(b.phaseGroupId ?? "") ?? -1;
      if (ga !== gb) return ga - gb;
      const ra = a.round ?? 0;
      const rb = b.round ?? 0;
      if (ra !== rb) return ra - rb;
      return a.scheduledAt.localeCompare(b.scheduledAt);
    });
  }, [matches, groups]);

  const visible = sorted.filter(
    (m) =>
      (!groupFilter || m.phaseGroupId === groupFilter) &&
      (!statusFilter || m.status === statusFilter),
  );

  if (matchesQuery.isLoading || teamsQuery.isLoading || groupsQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />;
  }

  if (matchesQuery.isError || teamsQuery.isError || groupsQuery.isError) {
    return (
      <Card className="border-red-100 p-6 text-center text-sm text-red-700">
        No se pudieron cargar los resultados de la fase. Recarga la página e
        inténtalo de nuevo.
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="Esta fase aún no tiene partidos"
          description="Genera el calendario para poder capturar resultados."
          action={
            phase.type === "group" ? (
              <ButtonLink to={`/phases/${phase.id}/fixtures`}>
                Ir al calendario
              </ButtonLink>
            ) : undefined
          }
        />
      </Card>
    );
  }

  const finished = matches.filter((m) => m.status === "finished").length;
  const percent = Math.round((finished / matches.length) * 100);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          Resultados y cédulas
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {finished} de {matches.length} partidos finalizados. Abre la cédula de
          un partido para iniciarlo y registrar sus goles.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[28rem]">
        {groups.length > 0 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className={selectClass}
            aria-label="Filtrar por grupo"
          >
            <option value="">Todos los grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MatchStatus | "")}
          className={selectClass}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(MATCH_STATUS_LABELS) as MatchStatus[]).map((status) => (
            <option key={status} value={status}>
              {MATCH_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-[36rem] overflow-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Grupo</th>
              <th className="w-14 px-3 py-2 font-medium">Jor.</th>
              <th className="px-3 py-2 text-right font-medium">Local</th>
              <th className="w-40 px-3 py-2 text-center font-medium">
                Marcador
              </th>
              <th className="px-3 py-2 font-medium">Visitante</th>
              <th className="w-28 px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  Ningún partido coincide con los filtros.
                </td>
              </tr>
            )}
            {visible.map((match) => {
              const hasScore =
                match.status === "in_progress" || match.status === "finished";
              return (
                <tr key={match.id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5 text-slate-600">
                    {match.phaseGroupId
                      ? (groupName.get(match.phaseGroupId) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {match.round ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                    {teamName.get(match.homeTeamId) ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Link
                      to={`/matches/${match.id}`}
                      title="Abrir cédula"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold tabular-nums text-slate-900 transition-colors hover:border-blue-500 hover:bg-blue-50"
                    >
                      {hasScore
                        ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                        : "vs"}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {teamName.get(match.awayTeamId) ?? "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadge[match.status]}`}
                    >
                      {MATCH_STATUS_LABELS[match.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
