import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserRound } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Card } from "../../../shared/components/ui/Card";
import { useCategories } from "../../categories";
import { useTeams } from "../../teams";
import { useMyTournament } from "../../tournaments";
import { PlayerForm } from "../components/PlayerForm";
import { useCreatePlayer } from "../hooks";

export function PlayerNewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultTeamId = params.get("teamId") ?? undefined;
  const defaultCategoryId = params.get("categoryId") ?? undefined;
  const { tournament, isLoading } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const { teams, isLoading: loadingTeams } = useTeams(tournament?.id, {
    limit: 100,
  });
  const createPlayer = useCreatePlayer(tournament?.id ?? "");

  if (isLoading || (tournament && (loadingCategories || loadingTeams))) {
    return (
      <div>
        <div className="mb-8 h-8 w-44 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader title="Nuevo jugador" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <UserRound size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Primero crea tu torneo
          </p>
          <Link
            to="/tournament"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear torneo →
          </Link>
        </Card>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div>
        <PageHeader title="Nuevo jugador" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <UserRound size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Necesitas un equipo
          </p>
          <Link
            to="/teams/new"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear equipo →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Nuevo jugador"
        description="Asigna el jugador a un equipo y completa sus datos."
      />
      <Card className="p-5 sm:p-6">
        <PlayerForm
          categories={categories}
          teams={teams}
          defaultTeamId={defaultTeamId}
          defaultCategoryId={defaultCategoryId}
          submitLabel="Crear jugador"
          submittingLabel="Creando…"
          onSubmit={async (input) => {
            const created = await createPlayer.mutateAsync(input);
            navigate(`/players/${created.id}`, { replace: true });
          }}
          extraActions={
            <Link
              to="/players"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </Link>
          }
        />
      </Card>
    </div>
  );
}
