import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  GitBranch,
  Pencil,
  Trophy,
  Users,
} from "lucide-react";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useMatches } from "../../matches";
import { useAllTeams } from "../../teams";
import { useMyTournament } from "../../tournaments";
import { usePhase, usePhaseGroups, usePhaseTeams } from "../hooks";
import {
  PHASE_STATUS_LABELS,
  PHASE_TYPE_LABELS,
  type PhaseStatus,
} from "../types";
import { PhaseWorkspaceNav } from "../components/PhaseWorkspaceNav";

interface Step {
  id: string;
  title: string;
  description: string;
  done: boolean;
  to: string;
  icon: typeof Users;
}
const statusClass: Record<PhaseStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  finished: "bg-slate-100 text-slate-600 ring-slate-500/15",
  upcoming: "bg-sky-50 text-sky-700 ring-sky-600/15",
};
const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

function Stat({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  note: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{note}</p>
      </div>
    </div>
  );
}

export function PhaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { phase, isLoading, isError } = usePhase(id);
  const groupsQuery = usePhaseGroups(
    phase?.type === "group" ? phase.id : undefined,
  );
  const phaseTeamsQuery = usePhaseTeams(phase?.id);
  const teamsQuery = useAllTeams(phase?.tournamentId, {
    categoryId: phase?.categoryId,
  });
  const matchesQuery = useMatches(phase?.tournamentId, {
    phaseId: phase?.id,
    limit: 100,
  });

  if (loadingTournament || isLoading)
    return (
      <div className="space-y-5">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  if (!tournament) return <Navigate to="/tournament" replace />;
  if (!phase || isError)
    return (
      <div>
        <PageHeader
          title="Fase no disponible"
          description="No pudimos encontrar esta fase o no se pudo cargar."
        />
        <Card className="p-6">
          <Link
            to="/phases"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <ArrowLeft size={16} />
            Volver a las fases
          </Link>
        </Card>
      </div>
    );

  const isGroup = phase.type === "group";
  const groups = groupsQuery.groups;
  const validGroupIds = new Set(groups.map((group) => group.id));
  const assignments = phaseTeamsQuery.assignments;
  const assigned = assignments.filter((assignment) =>
    isGroup
      ? !!assignment.phaseGroupId && validGroupIds.has(assignment.phaseGroupId)
      : true,
  ).length;
  const totalTeams = teamsQuery.teams.length;
  const matches = matchesQuery.matches;
  const matchesTotal = matchesQuery.pagination?.total ?? matches.length;
  const finishedMatches = matches.filter(
    (match) => match.status === "finished",
  ).length;
  const steps: Step[] = [];

  if (isGroup) {
    steps.push({
      id: "structure",
      title: "Configura grupos y equipos",
      description:
        groups.length === 0
          ? "Crea los grupos y distribuye los equipos participantes."
          : `${plural(groups.length, "grupo", "grupos")} · ${assigned} de ${totalTeams} equipos asignados correctamente`,
      done: groups.length > 0 && assigned >= 2,
      to: `/phases/${phase.id}/structure`,
      icon: Users,
    });
    steps.push({
      id: "fixtures",
      title: "Genera el calendario",
      description:
        matchesTotal === 0
          ? "Crea los encuentros de todos contra todos por grupo."
          : `${finishedMatches} de ${matchesTotal} partidos finalizados`,
      done: matchesTotal > 0,
      to: `/phases/${phase.id}/fixtures`,
      icon: CalendarDays,
    });
  } else if (phase.type === "league") {
    steps.push({
      id: "structure",
      title: "Inscribe los equipos",
      description:
        assigned === 0
          ? "Selecciona los equipos que participan en esta liga."
          : `${assigned} equipos inscritos`,
      done: assigned >= 2,
      to: `/phases/${phase.id}/structure`,
      icon: Users,
    });
  } else {
    steps.push({
      id: "bracket",
      title: "Configura la eliminatoria",
      description:
        "Los cruces deben generarse a partir de una fase de origen cerrada y sus clasificados.",
      done: false,
      to: `/phases/${phase.id}/edit`,
      icon: GitBranch,
    });
  }
  const doneCount = steps.filter((step) => step.done).length;
  const currentIndex = steps.findIndex((step) => !step.done);
  const progress = steps.length
    ? Math.round((doneCount / steps.length) * 100)
    : 0;
  const dateLabel =
    phase.startDate || phase.endDate
      ? `${phase.startDate ? formatDate(phase.startDate) : "Por definir"} – ${phase.endDate ? formatDate(phase.endDate) : "Por definir"}`
      : "Fechas por definir";

  return (
    <div className="space-y-6">
      <Link
        to="/phases"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Todas las fases
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Trophy size={25} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {PHASE_TYPE_LABELS[phase.type]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass[phase.status]}`}
                >
                  {PHASE_STATUS_LABELS[phase.status]}
                </span>
                <span className="text-xs text-slate-400">
                  Orden {phase.sortOrder}
                </span>
              </div>
              <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {phase.name}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={15} />
                {dateLabel}
              </p>
            </div>
          </div>
          <ButtonLink
            to={`/phases/${phase.id}/edit`}
            variant="secondary"
            className="shrink-0 self-start"
          >
            <Pencil size={16} />
            Editar fase
          </ButtonLink>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Categoría
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {"Categoría del torneo"}
          </p>
        </div>
      </div>

      <PhaseWorkspaceNav phase={phase} current="overview" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Equipos inscritos"
          value={assigned}
          icon={Users}
          note={isGroup ? "Asignados a un grupo" : "Participantes de la fase"}
        />
        <Stat
          label="Grupos creados"
          value={isGroup ? groups.length : "—"}
          icon={GitBranch}
          note={isGroup ? "Estructura de la fase" : "No aplica a este formato"}
        />
        <Stat
          label="Partidos generados"
          value={matchesTotal}
          icon={CalendarDays}
          note={`${finishedMatches} finalizados`}
        />
        <Stat
          label="Progreso de configuración"
          value={`${progress}%`}
          icon={Check}
          note={`${doneCount} de ${steps.length} pasos completados`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Puesta en marcha
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sigue estos pasos para preparar la competencia.
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
              {doneCount}/{steps.length}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ol className="mt-6 space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${step.done ? "bg-emerald-50 text-emerald-700" : index === currentIndex ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {step.done ? <Check size={17} /> : <Icon size={17} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {step.title}
                        </h3>
                        {step.done && (
                          <span className="text-[11px] font-bold text-emerald-700">
                            Completado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {step.description}
                      </p>
                      <Link
                        to={step.to}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800"
                      >
                        {step.done
                          ? "Revisar configuración"
                          : "Continuar configuración"}
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock3 size={19} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Estado de la competencia
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {phase.status === "finished"
                    ? "Esta fase está finalizada. Revisa sus resultados antes de modificar su estructura."
                    : phase.status === "active"
                      ? "La fase está en curso. Verifica la programación y mantén actualizados los resultados."
                      : "La fase todavía no comienza. Aprovecha para revisar grupos, equipos y calendario antes de activarla."}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <CircleHelp size={19} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Antes de hacer cambios
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Comprueba las asignaciones y los partidos existentes antes de
                  modificar la estructura. Los mocks conservan los cambios
                  localmente en este navegador.
                </p>
                <Link
                  to={`/phases/${phase.id}/edit`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800"
                >
                  Revisar configuración
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {groupsQuery.isError ||
      phaseTeamsQuery.isError ||
      teamsQuery.isError ||
      matchesQuery.isError ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Algunos indicadores no pudieron actualizarse. Revisa la conexión de
          mocks e inténtalo de nuevo.
        </p>
      ) : null}
    </div>
  );
}
