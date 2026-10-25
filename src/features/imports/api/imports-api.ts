import { api } from "../../../api/client";
import type { ImportResult } from "../types";

export const importsApi = {
    upload: async (
        tournamentId: string,
        file: File,
        dryRun: boolean,
    ): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append("file", file);

        const { data } = await api.post<ImportResult>(
            `/tournaments/${tournamentId}/import${dryRun ? "?dryRun=true" : ""
            }`,
            formData,
        );

        return data;
    },
};