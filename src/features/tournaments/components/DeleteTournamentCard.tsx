import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";

interface DeleteTournamentCardProps {
  tournamentName: string;
  pending: boolean;
  error: string | null;
  onDelete: () => void;
}

export function DeleteTournamentCard({
  tournamentName,
  pending,
  error,
  onDelete,
}: DeleteTournamentCardProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  // Es una acción destructiva y total: se pide escribir el nombre para confirmar.
  const canDelete = typed.trim() === tournamentName.trim();

  return (
    <Card className="border-red-100 p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-slate-900">Zona de peligro</h2>
      <p className="mt-1 text-sm text-slate-500">
        Eliminar el torneo borra de forma permanente sus categorías, fases,
        equipos, jugadores, partidos y sponsors. Solo el dueño puede hacerlo y
        no se puede deshacer.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-4 !border-red-200 !text-red-700 hover:!bg-red-50"
          onClick={() => setOpen(true)}
        >
          <Trash2 size={16} />
          Eliminar torneo
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <label
            htmlFor="confirm-tournament-name"
            className="block text-sm text-slate-700"
          >
            Para confirmar, escribe el nombre del torneo:{" "}
            <strong className="text-slate-900">{tournamentName}</strong>
          </label>
          <input
            id="confirm-tournament-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="!bg-red-600 hover:!bg-red-700"
              disabled={!canDelete || pending}
              onClick={onDelete}
            >
              {pending ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
            <button
              type="button"
              disabled={pending}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </Card>
  );
}
