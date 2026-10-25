import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { useCategories } from "../../categories";
import { useImportData } from "../hooks/use-import-data";
import { validateImportFile } from "../utils/file-validation";
import {
  getImportErrorMessage,
  getImportRowErrors,
} from "../utils/import-error-message";
import type { ImportRowError, ImportSummary } from "../types";

interface ImportSectionProps {
  tournamentId: string;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-2xl font-bold tabular-nums text-slate-900">
        {value.toLocaleString("es-MX")}
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function ImportSection({ tournamentId }: ImportSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const importData = useImportData(tournamentId);
  const categoriesQuery = useCategories(tournamentId);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [rowErrors, setRowErrors] = useState<{
    errors: ImportRowError[];
    truncated: boolean;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<ImportSummary | null>(null);

  const isValidating =
    importData.isPending && importData.variables?.dryRun === true;

  const isImporting =
    importData.isPending && importData.variables?.dryRun === false;

  const hasCategories = categoriesQuery.categories.length > 0;

  function clearFeedback() {
    setPreview(null);
    setRowErrors(null);
    setMessage(null);
    setDone(null);
  }

  function handleError(error: unknown) {
    const rows = getImportRowErrors(error);

    if (rows) {
      setRowErrors(rows);
      setMessage(null);
    } else {
      setMessage(getImportErrorMessage(error));
    }
  }

  function handleSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];

    // Permite seleccionar de nuevo el mismo archivo.
    event.target.value = "";

    if (!selected) return;

    clearFeedback();

    const validationError = validateImportFile(selected);

    if (validationError) {
      setFile(null);
      setMessage(validationError);
      return;
    }

    if (!hasCategories) {
      setFile(null);
      setMessage(
        "Primero crea al menos una categoría para poder asignar los equipos importados.",
      );
      return;
    }

    setFile(selected);

    // Dry run: el backend valida y devuelve el resumen sin guardar.
    importData.mutate(
      { file: selected, dryRun: true },
      {
        onSuccess: (result) => {
          setPreview(result.summary);
          setRowErrors(null);
          setMessage(null);
        },
        onError: handleError,
      },
    );
  }

  function handleConfirm() {
    if (!file || !preview) return;

    setMessage(null);
    setRowErrors(null);

    importData.mutate(
      { file, dryRun: false },
      {
        onSuccess: (result) => {
          setPreview(null);
          setFile(null);
          setDone(result.summary);
          setMessage(null);
        },
        onError: (error) => {
          // El archivo pudo dejar de ser válido desde la simulación.
          setPreview(null);
          handleError(error);
        },
      },
    );
  }

  function handleReset() {
    setFile(null);
    clearFeedback();
    importData.reset();
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileSpreadsheet size={21} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Importar equipos y jugadores
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Registra muchos equipos y jugadores de una sola vez utilizando una
              plantilla de Excel.
            </p>
          </div>
        </div>

        <a
          href="/plantilla-equipos-jugadores.xlsx"
          download
          className="min-h-9 px-3 rounded-lg border border-gray-400 bg-white text-xs font-medium text-gray-700 flex items-center hover:bg-gray-50 transition-colors shrink-0"
        >
          Descargar plantilla
        </a>
      </div>

      {categoriesQuery.isLoading ? (
        <div className="animate-pulse rounded-xl bg-slate-100 p-5 text-sm text-slate-500">
          Comprobando las categorías…
        </div>
      ) : categoriesQuery.isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron consultar las categorías. Recarga la página antes de
          intentar importar.
        </div>
      ) : !hasCategories ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Antes de importar, crea tus categorías.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            La columna categoría del Excel debe coincidir con una categoría
            existente en este torneo.
          </p>
          <Link
            to="/categories/new"
            className="mt-3 inline-block text-sm font-semibold text-amber-900 underline underline-offset-2"
          >
            Crear primera categoría
          </Link>
        </div>
      ) : !done ? (
        <button
          type="button"
          onClick={() => {
            if (!importData.isPending) fileRef.current?.click();
          }}
          disabled={importData.isPending}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40 disabled:cursor-wait disabled:opacity-60"
        >
          <Upload size={25} className="text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">
            {file ? file.name : "Selecciona tu archivo de Excel"}
          </span>
          <span className="text-xs text-slate-500">
            Archivo .xlsx · Máximo 5 MB · Hojas Equipos y Jugadores
          </span>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleSelectFile}
          />
        </button>
      ) : null}

      {isValidating && (
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Validando el archivo. Todavía no se ha guardado ningún dato…
        </div>
      )}

      {message && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          {message}
        </div>
      )}

      {rowErrors && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Se encontraron errores. No se importaron los datos.
            </p>

            {rowErrors.truncated && (
              <p className="mt-1 text-xs text-red-700">
                Se muestra una parte de los errores: corrige los indicados y
                vuelve a validar el archivo.
              </p>
            )}
          </div>

          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Hoja</th>
                  <th className="px-3 py-2 font-medium">Fila</th>
                  <th className="px-3 py-2 font-medium">Columna</th>
                  <th className="px-3 py-2 font-medium">Error</th>
                </tr>
              </thead>

              <tbody>
                {rowErrors.errors.map((error, index) => (
                  <tr
                    key={`${error.sheet}-${error.row}-${index}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-3 py-2">{error.sheet}</td>
                    <td className="px-3 py-2">{error.row}</td>
                    <td className="px-3 py-2">{error.field || "—"}</td>
                    <td className="px-3 py-2 text-red-700">{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" variant="secondary" onClick={handleReset}>
            Intentar con otro archivo
          </Button>
        </div>
      )}

      {preview && (
        <div className="mt-5">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">
              Vista previa de la importación
            </p>
            <p className="mt-1 text-sm text-slate-500">
              El archivo pasó la validación. Revisa el resumen antes de guardar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Equipos nuevos" value={preview.teamsCreated} />
            <StatCard
              label="Equipos existentes"
              value={preview.teamsExisting}
            />
            <StatCard label="Jugadores nuevos" value={preview.playersCreated} />
            <StatCard
              label="Jugadores omitidos"
              value={preview.playersSkipped}
            />
          </div>

          {preview.playersSkipped > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Los jugadores que ya existen en su equipo se omitirán.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isImporting || isValidating}
            >
              {isImporting ? "Importando…" : "Confirmar importación"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={isImporting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {isImporting && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          Guardando equipos y jugadores…
        </p>
      )}

      {done && (
        <div className="mt-2">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Importación completada
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                Los datos se procesaron correctamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Equipos creados" value={done.teamsCreated} />
            <StatCard label="Equipos existentes" value={done.teamsExisting} />
            <StatCard label="Jugadores creados" value={done.playersCreated} />
            <StatCard label="Jugadores omitidos" value={done.playersSkipped} />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={handleReset}
          >
            Importar otro archivo
          </Button>
        </div>
      )}
    </Card>
  );
}
