import { api } from "../../../api/client";
import type { Match } from "../../matches";
import type {
    BracketNode,
    GenerateBracketPayload,
    ScheduleBracketNodePayload,
    SetBracketNodePenaltiesPayload,
} from "../types";

export const bracketsService = {
    get: async (phaseId: string): Promise<BracketNode[]> => {
        const { data } = await api.get<{ nodes: BracketNode[] }>(
            `/phases/${phaseId}/bracket`,
        );
        return data.nodes ?? [];
    },

    generate: async (
        phaseId: string,
        payload: GenerateBracketPayload,
    ): Promise<BracketNode[]> => {
        const { data } = await api.post<{ nodes: BracketNode[] }>(
            `/phases/${phaseId}/bracket/generate`,
            payload,
        );
        return data.nodes ?? [];
    },

    // Solo mientras ningún cruce tenga partidos ni resultados.
    remove: async (phaseId: string): Promise<void> => {
        await api.delete(`/phases/${phaseId}/bracket`);
    },

    scheduleNode: async (
        phaseId: string,
        nodeId: string,
        payload: ScheduleBracketNodePayload,
    ): Promise<{ node: BracketNode; match: Match }> => {
        const { data } = await api.post<{ node: BracketNode; match: Match }>(
            `/phases/${phaseId}/bracket/nodes/${nodeId}/schedule`,
            payload,
        );
        return data;
    },

    // Penales de un cruce a ida y vuelta cuyo global quedó empatado (null en ambos los borra).
    setNodePenalties: async (
        phaseId: string,
        nodeId: string,
        payload: SetBracketNodePenaltiesPayload,
    ): Promise<BracketNode> => {
        const { data } = await api.put<{ node: BracketNode }>(
            `/phases/${phaseId}/bracket/nodes/${nodeId}/penalties`,
            payload,
        );
        return data.node;
    },
};