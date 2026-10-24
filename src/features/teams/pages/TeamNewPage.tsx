import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Users } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Card } from "../../../shared/components/ui/Card";
import { useCategories } from "../../categories";
import { useMyTournament } from "../../tournaments";
import { TeamForm } from "../components/TeamForm";
import { useCreateTeam } from "../hooks";

export function TeamNewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultCategoryId = params.get("categoryId") ?? undefined;
  const { tournament, isLoading } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const createTeam = useCreateTeam(tournament?.id ?? "");

  if (isLoading || (tournament && loadingCategories)) {
    return (
      <div>
        <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader title="Nuevo equipo" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <Users size={28} className="text-slate-300" />
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

  if (categories.length === 0) {
    return (
      <div>
        <PageHeader title="Nuevo equipo" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <Users size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Necesitas una categoría
          </p>
          <Link
            to="/categories/new"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear categoría →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Nuevo equipo"
        description="Asigna el equipo a una categoría y define su nombre."
      />
      <Card className="p-5 sm:p-6">
        <TeamForm
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          submitLabel="Crear equipo"
          submittingLabel="Creando…"
          onSubmit={async (input) => {
            const created = await createTeam.mutateAsync(input);
            navigate(`/teams/${created.id}`, { replace: true });
          }}
          extraActions={
            <Link
              to="/teams"
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
