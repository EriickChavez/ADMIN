import { api } from "../../../api/client";
import type {
    Phase,
    PhaseInput,
    PhaseResponse,
    PhasesResponse,
} from "../types";

function toBody(input: Partial<PhaseInput>) {
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.type !== undefined) body.type = input.type;
    if (input.status !== undefined) body.status = input.status;
    if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder;
    if (input.startDate !== undefined) {
        if (input.startDate) body.startDate = input.startDate;
        else body.startDate = null;
    }
    if (input.endDate !== undefined) {
        if (input.endDate) body.endDate = input.endDate;
        else body.endDate = null;
    }
    return body;
}

export const phasesService = {
    listByCategory: async (
        tournamentId: string,
        categoryId: string,
    ): Promise<Phase[]> => {
        const { data } = await api.get<PhasesResponse>(
            `/tournaments/${tournamentId}/categories/${categoryId}/phases`,
        );
        return data.phases ?? [];
    },

    get: async (id: string): Promise<Phase> => {
        const { data } = await api.get<PhaseResponse>(`/phases/${id}`);
        return data.phase;
    },

    create: async (
        tournamentId: string,
        categoryId: string,
        input: PhaseInput,
    ): Promise<Phase> => {
        const { data } = await api.post<PhaseResponse>(
            `/tournaments/${tournamentId}/categories/${categoryId}/phases`,
            toBody(input),
        );
        return data.phase;
    },

    update: async (id: string, input: Partial<PhaseInput>): Promise<Phase> => {
        const { data } = await api.patch<PhaseResponse>(
            `/phases/${id}`,
            toBody(input),
        );
        return data.phase;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/phases/${id}`);
    },
};