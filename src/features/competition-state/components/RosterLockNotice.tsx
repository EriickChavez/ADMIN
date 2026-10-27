import { useCategoryLocks } from "../hooks";

interface RosterLockNoticeProps {
  tournamentId: string;
  categories: { id: string; title: string }[];
}

export function RosterLockNotice({
  tournamentId,
  categories,
}: RosterLockNoticeProps) {
  const { stateOf } = useCategoryLocks(tournamentId);

  const started = categories.filter((c) => stateOf(c.id) === "in_progress");
  const finished = categories.filter((c) => stateOf(c.id) === "finished");

  if (started.length === 0 && finished.length === 0) return null;

  return (
    <div
      role="status"
      className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
    >
      <p className="font-semibold">Plantilla bloqueada en algunas categorías</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {started.length > 0 && (
          <li>
            Ya empezaron: {started.map((c) => c.title).join(", ")}. No se pueden
            agregar, mover ni eliminar equipos ni jugadores; sí corregir sus
            datos.
          </li>
        )}
        {finished.length > 0 && (
          <li>
            Campeonato cerrado: {finished.map((c) => c.title).join(", ")}. No se
            puede cambiar nada de su plantilla hasta reabrirlo.
          </li>
        )}
      </ul>
    </div>
  );
}
