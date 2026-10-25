import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { usePhase } from "../../phases";
import { useAllTeams } from "../../teams";
import { useMyTournament } from "../../tournaments";
import { BracketPanel } from "../components/BracketPanel";
import { PhaseWorkspaceNav } from "../../phases/components/PhaseWorkspaceNav";

export function PhaseBracketPage() {
  const { id } = useParams<{ id: string }>();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { phase, isLoading } = usePhase(id);
  const teamsQuery = useAllTeams(phase?.tournamentId, {
    categoryId: phase?.categoryId,
  });

  if (loadingTournament || isLoading || teamsQuery.isLoading) {
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

  // La llave solo existe en fases de eliminación.
  if (phase.type !== "knockout") {
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
        title="Llave"
        description="Genera los cruces desde los clasificados, prográmalos y sigue el avance hasta la final."
      />

      <PhaseWorkspaceNav phase={phase} current="bracket" />
      <BracketPanel phase={phase} teams={teamsQuery.teams} />
    </div>
  );
}
