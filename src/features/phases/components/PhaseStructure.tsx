import { Users } from "lucide-react";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useTeams } from "../../teams/hooks";
import { usePhaseGroups, usePhaseTeams } from "../hooks";
import type { Phase } from "../types";
import { PhaseGroupsPanel } from "./PhaseGroupsPanel";
import { PhaseTeamsPanel } from "./PhaseTeamsPanel";

export function PhaseStructure({ phase }: { phase: Phase }) {
  const isGroupPhase = phase.type === "group";

  const groupsQuery = usePhaseGroups(isGroupPhase ? phase.id : undefined);
  const phaseTeamsQuery = usePhaseTeams(phase.id);
  const teamsQuery = useTeams(phase.tournamentId, {
    categoryId: phase.categoryId,
    limit: 100,
  });

  const loading =
    groupsQuery.isLoading || phaseTeamsQuery.isLoading || teamsQuery.isLoading;
  const failed =
    groupsQuery.isError || phaseTeamsQuery.isError || teamsQuery.isError;

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="h-56 animate-pulse rounded-xl bg-slate-200/70" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (failed) {
    return (
      <Card className="border-red-100 p-6 text-center text-sm text-red-700">
        No se pudo cargar la estructura de la fase. Recarga la página e
        inténtalo de nuevo.
      </Card>
    );
  }

  if (teamsQuery.teams.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="Esta categoría no tiene equipos"
          description="Crea los equipos de la categoría para poder inscribirlos en la fase."
          action={<ButtonLink to="/teams/new">Crear equipo</ButtonLink>}
        />
      </Card>
    );
  }

  const truncated = (teamsQuery.pagination?.totalPages ?? 1) > 1;

  const teamsPanel = (
    <PhaseTeamsPanel
      phase={phase}
      groups={groupsQuery.groups}
      teams={teamsQuery.teams}
      assignments={phaseTeamsQuery.assignments}
    />
  );

  return (
    <div className="space-y-6">
      {truncated && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Se muestran los primeros 100 equipos de la categoría.
        </p>
      )}

      {isGroupPhase ? (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <PhaseGroupsPanel phaseId={phase.id} groups={groupsQuery.groups} />
          {teamsPanel}
        </div>
      ) : (
        teamsPanel
      )}
    </div>
  );
}
