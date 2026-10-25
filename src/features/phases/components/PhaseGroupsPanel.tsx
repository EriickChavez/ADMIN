import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { useCreatePhaseGroup, useDeletePhaseGroup } from "../hooks";
import type { PhaseGroup } from "../types";
import { getPhaseErrorMessage } from "../utils/errors";

interface PhaseGroupsPanelProps {
  phaseId: string;
  groups: PhaseGroup[];
}

const MAX_GENERATED_GROUPS = 26; // A–Z

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function PhaseGroupsPanel({ phaseId, groups }: PhaseGroupsPanelProps) {
  const createGroup = useCreatePhaseGroup(phaseId);
  const deleteGroup = useDeletePhaseGroup(phaseId);

  const [name, setName] = useState("");
  const [count, setCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await createGroup.mutateAsync({
        name: trimmed,
        sortOrder: groups.length + 1,
      });
      setName("");
    } catch (err) {
      setError(getPhaseErrorMessage(err));
    }
  }

  // Crea "Grupo A", "Grupo B"... hasta `count`, saltando los que ya existen.
  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    const existing = new Set(groups.map((g) => g.name));
    try {
      for (let i = 0; i < count; i += 1) {
        const groupName = `Grupo ${String.fromCharCode(65 + i)}`;
        if (existing.has(groupName)) continue;
        await createGroup.mutateAsync({ name: groupName, sortOrder: i + 1 });
      }
    } catch (err) {
      setError(getPhaseErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDelete(group: PhaseGroup) {
    if (
      !window.confirm(
        `¿Eliminar "${group.name}"? Los equipos asignados quedarán sin grupo.`,
      )
    ) {
      return;
    }
    setError(null);
    deleteGroup.mutate(group.id, {
      onError: (err) => setError(getPhaseErrorMessage(err)),
    });
  }

  const busy = isGenerating || createGroup.isPending;

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Grupos</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Crea los grupos de esta fase y luego asigna los equipos.
      </p>

      {groups.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {groups.map((group) => (
            <span
              key={group.id}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm text-slate-800"
            >
              {group.name}
              <button
                type="button"
                onClick={() => handleDelete(group)}
                disabled={deleteGroup.isPending}
                title="Eliminar grupo"
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del grupo"
            className={inputClass}
            autoComplete="off"
          />
          <Button type="submit" disabled={busy || !name.trim()}>
            <Plus size={16} />
            Añadir
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={MAX_GENERATED_GROUPS}
            value={count}
            onChange={(e) =>
              setCount(
                Math.min(
                  MAX_GENERATED_GROUPS,
                  Math.max(1, Number(e.target.value) || 1),
                ),
              )
            }
            className={`${inputClass} !w-20`}
            aria-label="Cantidad de grupos"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerate}
            disabled={busy}
          >
            {isGenerating
              ? "Generando…"
              : `Generar grupos A–${String.fromCharCode(64 + count)}`}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </Card>
  );
}
