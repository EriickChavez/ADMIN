import { CalendarDays } from "lucide-react";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useAllTeams } from "../../teams";
import { usePhaseGroups, usePhaseTeams } from "../hooks";
import type { Phase } from "../types";
import { PhaseFixturesPanel } from "./PhaseFixturesPanel";

export function PhaseFixtures({ phase }: { phase: Phase }) {
  const groupsQuery = usePhaseGroups(phase.id);
  const phaseTeamsQuery = usePhaseTeams(phase.id);
  const teamsQuery = useAllTeams(phase.tournamentId, {
    categoryId: phase.categoryId,
  });

  const loading =
    groupsQuery.isLoading || phaseTeamsQuery.isLoading || teamsQuery.isLoading;

  const failed =
    groupsQuery.isError || phaseTeamsQuery.isError || teamsQuery.isError;

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />;
  }

  if (failed) {
    return (
      <Card className="border-red-100 p-6 text-center text-sm text-red-700">
        No se pudo cargar el calendario de la fase. Recarga la página e
        inténtalo de nuevo.
      </Card>
    );
  }

  const hasGroupedTeams =
    groupsQuery.groups.length > 0 &&
    phaseTeamsQuery.assignments.some((assignment) => !!assignment.phaseGroupId);

  if (!hasGroupedTeams) {
    return (
      <Card>
        <EmptyState
          icon={CalendarDays}
          title="Primero arma los grupos"
          description="Para generar el calendario necesitas grupos con equipos asignados."
          action={
            <ButtonLink to={`/phases/${phase.id}/structure`}>
              Ir a grupos y equipos
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  return (
    <PhaseFixturesPanel
      phase={phase}
      groups={groupsQuery.groups}
      teams={teamsQuery.teams}
      assignments={phaseTeamsQuery.assignments}
    />
  );
}
