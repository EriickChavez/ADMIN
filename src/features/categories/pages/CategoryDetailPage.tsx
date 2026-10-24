import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Layers, Trash2 } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { useMyTournament } from "../../tournaments";
import { CategoryForm } from "../components/CategoryForm";
import { useCategory, useDeleteCategory, useUpdateCategory } from "../hooks";

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { category, isLoading } = useCategory(tournament?.id, id);
  const updateCategory = useUpdateCategory(tournament?.id ?? "");
  const deleteCategory = useDeleteCategory(tournament?.id ?? "");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loadingTournament || (tournament && isLoading)) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-56 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) {
    return <Navigate to="/tournament" replace />;
  }

  if (!category) {
    return (
      <div>
        <PageHeader title="Categoría" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <Layers size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Categoría no encontrada
          </p>
          <Link
            to="/categories"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver todas las categorías →
          </Link>
        </Card>
      </div>
    );
  }

  const onDelete = async () => {
    setDeleteError(null);
    try {
      await deleteCategory.mutateAsync(category.id);
      navigate("/categories", { replace: true });
    } catch {
      setDeleteError("No se pudo eliminar la categoría");
      setConfirmDelete(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={category.title}
        description="Edita los datos de esta categoría o elimínala."
      />

      {saved && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Cambios guardados
            </p>
            <p className="mt-0.5 text-sm text-emerald-800">
              La categoría se actualizó correctamente.
            </p>
          </div>
        </div>
      )}

      <Card className="p-5 sm:p-6">
        <CategoryForm
          key={category.id}
          initial={category}
          submitLabel="Guardar cambios"
          submittingLabel="Guardando…"
          onSubmit={async (input) => {
            setSaved(false);
            await updateCategory.mutateAsync({ id: category.id, input });
            setSaved(true);
          }}
          extraActions={
            <Link
              to="/categories"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Volver al listado
            </Link>
          }
        />
      </Card>

      <Card className="mt-6 border-red-100 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Zona de peligro
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Eliminar esta categoría es permanente. Los equipos o partidos
          asociados podrían quedar afectados en el backend.
        </p>

        {deleteError && (
          <p className="mt-3 text-sm text-red-600">{deleteError}</p>
        )}

        {!confirmDelete ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 !border-red-200 !text-red-700 hover:!bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} />
            Eliminar categoría
          </Button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="!bg-red-600 hover:!bg-red-700"
              disabled={deleteCategory.isPending}
              onClick={onDelete}
            >
              {deleteCategory.isPending ? "Eliminando…" : "Sí, eliminar"}
            </Button>
            <button
              type="button"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
              onClick={() => setConfirmDelete(false)}
            >
              Cancelar
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
