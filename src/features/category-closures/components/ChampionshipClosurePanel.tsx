import { useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { ConfirmBox } from "../../../shared/components/ui/ConfirmBox";
import {
  useCategoryClosures,
  useCloseCategory,
  useReopenCategory,
} from "../hooks";
import { getClosureErrorMessage } from "../utils/errors";

interface ChampionshipClosurePanelProps {
  tournamentId: string;
  categoryId: string;
  /** Campeón detectado en la llave (ganador de la final); null si aún no hay. */
  championName: string | null;
  teamName: (id: string) => string;
}

type Pending = "close" | "reopen" | null;

export function ChampionshipClosurePanel({
  tournamentId,
  categoryId,
  championName,
  teamName,
}: ChampionshipClosurePanelProps) {
  const { closures } = useCategoryClosures(tournamentId);
  const closeCategory = useCloseCategory(tournamentId, categoryId);
  const reopenCategory = useReopenCategory(tournamentId, categoryId);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);

  const closure = closures.find((c) => c.categoryId === categoryId) ?? null;

  function runClose() {
    setPending(null);
    setError(null);
    closeCategory.mutate(undefined, {
      onError: (err) => setError(getClosureErrorMessage(err)),
    });
  }

  function runReopen() {
    setPending(null);
    setError(null);
    reopenCategory.mutate(undefined, {
      onError: (err) => setError(getClosureErrorMessage(err)),
    });
  }

  // Campeonato cerrado.
  if (closure) {
    return (
      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">
              Campeonato cerrado
            </h3>
            <p className="text-xs text-emerald-800">
              Campeón:{" "}
              <strong>
                {closure.championTeamId
                  ? teamName(closure.championTeamId)
                  : "—"}
              </strong>
              {" · "}cerrado el{" "}
              {new Date(closure.closedAt).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              . No se pueden crear fases nuevas en esta categoría.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPending("reopen")}
            disabled={reopenCategory.isPending}
            className="shrink-0"
          >
            {reopenCategory.isPending ? "Reabriendo…" : "Reabrir campeonato"}
          </Button>
        </div>

        {pending === "reopen" && (
          <div className="mt-3">
            <ConfirmBox
              message="Reabrir el campeonato permite volver a crear fases en esta categoría."
              confirmLabel="Sí, reabrir"
              onConfirm={runReopen}
              onCancel={() => setPending(null)}
            />
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Ya hay campeón pero el campeonato sigue abierto: se sugiere cerrarlo (el cierre es manual).
  if (championName) {
    return (
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900">
              Ya hay campeón
            </h3>
            <p className="text-xs text-blue-800">
              <strong>{championName}</strong> ganó la final. Cierra el
              campeonato para dejarlo definido e impedir fases nuevas en esta
              categoría.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setPending("close")}
            disabled={closeCategory.isPending}
            className="shrink-0"
          >
            {closeCategory.isPending ? "Cerrando…" : "Cerrar campeonato"}
          </Button>
        </div>

        {pending === "close" && (
          <div className="mt-3">
            <ConfirmBox
              message={`Vas a cerrar el campeonato de esta categoría con ${championName} como campeón.\n\nYa no se podrán crear fases nuevas en ella. Podrás reabrirlo si te equivocas.`}
              confirmLabel="Sí, cerrar campeonato"
              onConfirm={runClose}
              onCancel={() => setPending(null)}
            />
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
}
