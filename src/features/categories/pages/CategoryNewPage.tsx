import { Link, useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Card } from "../../../shared/components/ui/Card";
import { useMyTournament } from "../../tournaments";
import { CategoryForm } from "../components/CategoryForm";
import { useCreateCategory } from "../hooks";

export function CategoryNewPage() {
  const navigate = useNavigate();
  const { tournament, isLoading } = useMyTournament();
  const createCategory = useCreateCategory(tournament?.id ?? "");

  if (isLoading) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader title="Nueva categoría" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <Layers size={28} className="text-slate-300" />
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

  return (
    <div>
      <PageHeader
        title="Nueva categoría"
        description="Define el nombre y el rango de edad. Podrás editarlo después."
      />
      <Card className="p-5 sm:p-6">
        <CategoryForm
          submitLabel="Crear categoría"
          submittingLabel="Creando…"
          onSubmit={async (input) => {
            const created = await createCategory.mutateAsync(input);
            navigate(`/categories/${created.id}`, { replace: true });
          }}
          extraActions={
            <Link
              to="/categories"
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
