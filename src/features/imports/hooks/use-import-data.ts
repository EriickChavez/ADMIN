import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importsApi } from "../api/imports-api";

interface ImportVariables {
    file: File;
    dryRun: boolean;
}

export function useImportData(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, dryRun }: ImportVariables) =>
            importsApi.upload(tournamentId, file, dryRun),

        onSuccess: async (result) => {
            // La simulación no modifica información.
            if (result.dryRun) return;

            // Actualizar los listados afectados por la importación.
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["teams", tournamentId],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["players", tournamentId],
                }),
            ]);
        },
    });
}