import { Link } from "react-router-dom";
import { Layers, Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useMyTournament } from "../../tournaments";
import { useCategories } from "../hooks";
import type { Category } from "../types";

const ageRange = ({ minAge, maxAge }: Category) => {
  if (minAge != null && maxAge != null) return `${minAge}–${maxAge} años`;
  if (maxAge != null) return `Hasta ${maxAge} años`;
  if (minAge != null) return `Desde ${minAge} años`;
  return "Sin rango de edad";
};

export function CategoriesPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading } = useCategories(tournament?.id);

  if (loadingTournament || (tournament && isLoading)) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-slate-200/70"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader
          title="Categorías"
          description="Organiza tu torneo por edades o divisiones."
        />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Layers size={28} />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            Primero crea tu torneo
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Las categorías pertenecen a un torneo. Créalo y vuelve aquí.
          </p>
          <Link
            to="/tournament"
            className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear torneo →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Categorías"
          description="Gestiona las divisiones de tu torneo. Cada una tendrá sus propios equipos y partidos."
        />
        <ButtonLink to="/categories/new" className="shrink-0 self-start">
          <Plus size={16} />
          Nueva categoría
        </ButtonLink>
      </div>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="Aún no hay categorías"
            description="Crea la primera (por ejemplo Sub-15) para empezar a organizar equipos."
            action={
              <ButtonLink to="/categories/new">
                <Plus size={16} />
                Crear categoría
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/categories/${c.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {c.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {ageRange(c)}
                      {c.description ? ` · ${c.description}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    #{c.order}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
