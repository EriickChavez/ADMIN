import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GitBranch } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Card } from "../../../shared/components/ui/Card";
import { useCategories } from "../../categories";
import { useMyTournament } from "../../tournaments";
import { PhaseForm } from "../components/PhaseForm";
import { useCreatePhase } from "../hooks";

export function PhaseNewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { tournament, isLoading } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );

  const categoryId = params.get("categoryId") || categories[0]?.id || "";

  const createPhase = useCreatePhase(tournament?.id ?? "", categoryId);

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
        <PageHeader title="Nueva fase" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <GitBranch size={28} className="text-slate-300" />
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

  if (!categoryId) {
    return (
      <div>
        <PageHeader title="Nueva fase" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <GitBranch size={28} className="text-slate-300" />
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

  const categoryTitle =
    categories.find((c) => c.id === categoryId)?.title ?? "Categoría";

  return (
    <div>
      <PageHeader
        title="Nueva fase"
        description={`Categoría: ${categoryTitle}`}
      />
      <Card className="p-5 sm:p-6">
        <PhaseForm
          submitLabel="Crear fase"
          submittingLabel="Creando…"
          onSubmit={async (input) => {
            const created = await createPhase.mutateAsync(input);
            navigate(`/phases/${created.id}`, { replace: true });
          }}
          extraActions={
            <Link
              to="/phases"
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
