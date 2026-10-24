import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GitBranch, Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useCategories } from "../../categories";
import { useMyTournament } from "../../tournaments";
import { usePhases } from "../hooks";
import { PHASE_STATUS_LABELS, PHASE_TYPE_LABELS, type Phase } from "../types";

const statusClass = (status: Phase["status"]) => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "finished":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
};

export function PhasesPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const { phases, isLoading } = usePhases(
    tournament?.id,
    categoryId || undefined,
  );

  if (loadingTournament || (tournament && loadingCategories)) {
    return (
      <div>
        <div className="mb-8 h-8 w-36 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader title="Fases" description="" />
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

  if (categories.length === 0) {
    return (
      <div>
        <PageHeader
          title="Fases"
          description="Las fases organizan la competencia dentro de cada categoría."
        />
        <Card>
          <EmptyState
            icon={GitBranch}
            title="Necesitas una categoría"
            description="Crea una categoría antes de definir fases."
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

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Fases"
          description="Define grupos, eliminatorias o liga por categoría."
        />
        <ButtonLink
          to={`/phases/new?categoryId=${categoryId}`}
          className="shrink-0 self-start"
        >
          <Plus size={16} />
          Nueva fase
        </ButtonLink>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label
          htmlFor="phase-cat"
          className="text-sm font-medium text-slate-600"
        >
          Categoría
        </label>
        <select
          id="phase-cat"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-200/70"
            />
          ))}
        </div>
      ) : phases.length === 0 ? (
        <Card>
          <EmptyState
            icon={GitBranch}
            title="No hay fases en esta categoría"
            description="Crea la primera fase (por ejemplo fase de grupos)."
            action={
              <ButtonLink to={`/phases/new?categoryId=${categoryId}`}>
                <Plus size={16} />
                Nueva fase
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {phases.map((phase) => (
              <li key={phase.id}>
                <Link
                  to={`/phases/${phase.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {phase.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {PHASE_TYPE_LABELS[phase.type]}
                      {phase.startDate || phase.endDate
                        ? ` · ${phase.startDate ?? "?"} – ${phase.endDate ?? "?"}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(phase.status)}`}
                  >
                    {PHASE_STATUS_LABELS[phase.status]}
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
