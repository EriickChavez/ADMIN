import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, GitBranch, Pencil } from "lucide-react";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useTeams } from "../../teams/hooks";
import { useMyTournament } from "../../tournaments";
import { usePhase, usePhaseGroups, usePhaseTeams } from "../hooks";
import {
  PHASE_STATUS_LABELS,
  PHASE_TYPE_LABELS,
  type PhaseStatus,
} from "../types";

interface Step {
  id: string;
  title: string;
  description: string;
  done: boolean;
  to: string;
}

const statusClass = (status: PhaseStatus) => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "finished":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export function PhaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { phase, isLoading } = usePhase(id);

  const groupsQuery = usePhaseGroups(
    phase?.type === "group" ? phase.id : undefined,
  );
  const phaseTeamsQuery = usePhaseTeams(phase?.id);
  const teamsQuery = useTeams(phase?.tournamentId, {
    categoryId: phase?.categoryId,
    limit: 100,
  });

  if (loadingTournament || isLoading) {
    return (
      <div>
        <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) return <Navigate to="/tournament" replace />;

  if (!phase) {
    return (
      <div>
        <PageHeader title="Fase" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <GitBranch size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Fase no encontrada
          </p>
          <Link
            to="/phases"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver todas las fases →
          </Link>
        </Card>
      </div>
    );
  }

  const isGroup = phase.type === "group";
  const groups = groupsQuery.groups;
  const validGroupIds = new Set(groups.map((g) => g.id));
  const assigned = phaseTeamsQuery.assignments.filter((a) =>
    isGroup ? !!a.phaseGroupId && validGroupIds.has(a.phaseGroupId) : true,
  ).length;
  const totalTeams = teamsQuery.pagination?.total ?? teamsQuery.teams.length;

  // Cada etapa nueva agrega aquí su paso, en el orden en que se hace.
  const steps: Step[] = [];
  if (isGroup) {
    steps.push({
      id: "structure",
      title: "Grupos y equipos",
      description:
        groups.length === 0
          ? "Crea los grupos y reparte los equipos."
          : `${plural(groups.length, "grupo", "grupos")} · ${assigned} de ${totalTeams} equipos asignados`,
      done: groups.length > 0 && assigned >= 2,
      to: `/phases/${phase.id}/structure`,
    });
  } else if (phase.type === "league") {
    steps.push({
      id: "structure",
      title: "Equipos",
      description:
        assigned === 0
          ? "Elige qué equipos juegan esta fase."
          : `${assigned} de ${totalTeams} equipos inscritos`,
      done: assigned >= 2,
      to: `/phases/${phase.id}/structure`,
    });
  }

  const doneCount = steps.filter((s) => s.done).length;
  const currentIndex = steps.findIndex((s) => !s.done);
  const percent =
    steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);

  const dates =
    phase.startDate || phase.endDate
      ? `${phase.startDate ?? "?"} – ${phase.endDate ?? "?"}`
      : null;

  return (
    <div>
      <Link
        to="/phases"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        Fases
      </Link>

      <PageHeader
        title={phase.name}
        description={[PHASE_TYPE_LABELS[phase.type], dates]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(phase.status)}`}
            >
              {PHASE_STATUS_LABELS[phase.status]}
            </span>
            <ButtonLink to={`/phases/${phase.id}/edit`} variant="secondary">
              <Pencil size={16} />
              Editar fase
            </ButtonLink>
          </>
        }
      />

      {steps.length === 0 ? (
        <Card className="max-w-3xl p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Equipos de la eliminatoria
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Los equipos de una fase de eliminación salen de los clasificados de
            una fase de grupos cerrada, así que aquí no se inscriben a mano.
          </p>
        </Card>
      ) : (
        <Card className="max-w-3xl p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Recorrido de la fase
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {doneCount} de {steps.length} completados
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ol className="mt-5 space-y-5">
            {steps.map((step, i) => (
              <li key={step.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    step.done
                      ? "bg-emerald-100 text-emerald-600"
                      : i === currentIndex
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.done ? <Check size={14} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {step.description}
                  </p>
                </div>
                <ButtonLink
                  to={step.to}
                  variant="secondary"
                  className="shrink-0"
                >
                  {step.done ? "Revisar" : "Configurar"}
                </ButtonLink>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
