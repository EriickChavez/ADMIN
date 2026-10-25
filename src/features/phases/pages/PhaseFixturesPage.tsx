import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useMyTournament } from "../../tournaments";
import { PhaseFixtures } from "../components/PhaseFixtures";
import { usePhase } from "../hooks";
import { PhaseWorkspaceNav } from "../components/PhaseWorkspaceNav";

export function PhaseFixturesPage() {
  const { id } = useParams<{ id: string }>();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { phase, isLoading } = usePhase(id);

  if (loadingTournament || isLoading) {
    return (
      <div>
        <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
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

  // El calendario todos contra todos por grupo solo aplica a fases de grupos.
  if (phase.type !== "group") {
    return <Navigate to={`/phases/${phase.id}`} replace />;
  }

  return (
    <div>
      <Link
        to={`/phases/${phase.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        {phase.name}
      </Link>

      <PageHeader
        title="Calendario"
        description="Genera los partidos de todos contra todos de cada grupo."
      />

      <PhaseWorkspaceNav phase={phase} current="fixtures" />
      <PhaseFixtures phase={phase} />
    </div>
  );
}
