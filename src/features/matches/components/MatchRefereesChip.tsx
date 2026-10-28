import { UserCheck } from "lucide-react";
import { useMatchReferees } from "../hooks";

interface MatchRefereesChipProps {
  matchId: string;
  memberNameById: Map<string, string>;
}

export function MatchRefereesChip({
  matchId,
  memberNameById,
}: MatchRefereesChipProps) {
  const { refereeUserIds, isLoading, error } = useMatchReferees(matchId);

  // Mientras carga (o si falla) no se muestra nada: el chip es solo informativo.
  if (isLoading || error) return null;

  const names = refereeUserIds.map((id) => memberNameById.get(id) ?? "Usuario");

  if (names.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
        <UserCheck size={12} />
        Sin árbitro asignado
      </span>
    );
  }

  const label =
    names.length <= 2
      ? names.join(", ")
      : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;

  return (
    <span
      title={names.join(", ")}
      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[11px] font-medium text-teal-700"
    >
      <UserCheck size={12} />
      {label}
    </span>
  );
}
