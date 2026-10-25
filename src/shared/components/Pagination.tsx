import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({
  page,
  limit,
  totalPages,
  total,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startItem = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-xs text-slate-500">
        Mostrando {startItem}–{endItem} de {total} resultados
      </p>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs text-slate-500">
          Página {currentPage} de {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={disabled || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Página siguiente"
            disabled={disabled || currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
