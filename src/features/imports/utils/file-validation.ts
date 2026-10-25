export const MAX_IMPORT_FILE_MB = 5;

export function validateImportFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
        return "Formato no permitido. Selecciona un archivo .xlsx.";
    }

    if (file.size === 0) {
        return "El archivo está vacío.";
    }

    if (file.size > MAX_IMPORT_FILE_MB * 1024 * 1024) {
        return `El archivo excede el máximo de ${MAX_IMPORT_FILE_MB} MB.`;
    }

    return null;
}