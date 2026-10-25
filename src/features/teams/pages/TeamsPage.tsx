import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Pagination } from "../../../shared/components/Pagination";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useCategories } from "../../categories";
import { useMyTournament } from "../../tournaments";
import { useTeams } from "../hooks";

const PAGE_SIZE = 20;

export function TeamsPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(categoryId ? { categoryId } : {}),
    }),
    [page, categoryId],
  );

  const { teams, pagination, isLoading } = useTeams(tournament?.id, query);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.title);
    return map;
  }, [categories]);

  if (loadingTournament || (tournament && (isLoading || loadingCategories))) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-200/70"
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
          title="Equipos"
          description="Administra los equipos de tu torneo."
        />
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
        <PageHeader
          title="Equipos"
          description="Los equipos pertenecen a una categoría."
        />
        <Card>
          <EmptyState
            icon={Users}
            title="Necesitas al menos una categoría"
            description="Crea una categoría antes de registrar equipos."
            action={
              <ButtonLink to="/categories/new">
                <Plus size={16} />
                Crear categoría
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Equipos"
          description="Gestiona los equipos por categoría."
        />
        <ButtonLink to="/teams/new" className="shrink-0 self-start">
          <Plus size={16} />
          Nuevo equipo
        </ButtonLink>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label
          className="text-sm font-medium text-slate-600"
          htmlFor="filter-cat"
        >
          Categoría
        </label>
        <select
          id="filter-cat"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          {total} {total === 1 ? "equipo" : "equipos"}
        </span>
      </div>

      {teams.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No hay equipos"
            description={
              categoryId
                ? "No hay equipos en esta categoría."
                : "Crea el primer equipo del torneo."
            }
            action={
              <ButtonLink to="/teams/new">
                <Plus size={16} />
                Nuevo equipo
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  to={`/teams/${team.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                    {team.abbreviation}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {team.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {categoryMap.get(team.categoryId) ?? "Sin categoría"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            limit={PAGE_SIZE}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
