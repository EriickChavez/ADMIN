import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { PhaseGroup, PhaseTeam, SyncPhaseTeamItem } from "./types";
import type { Match } from "../matches/types";

const GROUPS_KEY = "mock_phase_groups";
const TEAMS_KEY = "mock_phase_teams";
const MATCHES_KEY = "mock_matches";

const now = () => new Date().toISOString();

function read<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) as T[];
    } catch {
        // corrupted
    }
    return [];
}

function write<T>(key: string, list: T[]) {
    localStorage.setItem(key, JSON.stringify(list));
}

export const phaseStructureHandlers = [
    http.get(`${API_URL}/phases/:phaseId/groups`, ({ params }) => {
        const groups = read<PhaseGroup>(GROUPS_KEY)
            .filter((g) => g.phaseId === params.phaseId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        return HttpResponse.json({ groups });
    }),

    http.post(
        `${API_URL}/phases/:phaseId/groups`,
        async ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }
            const body = (await request.json()) as {
                name?: string;
                sortOrder?: number;
            };
            const name = body.name?.trim();
            if (!name) {
                return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
            }

            const all = read<PhaseGroup>(GROUPS_KEY);
            const siblings = all.filter((g) => g.phaseId === params.phaseId);
            const group: PhaseGroup = {
                id: crypto.randomUUID(),
                phaseId: params.phaseId as string,
                name,
                sortOrder: body.sortOrder ?? siblings.length + 1,
                createdAt: now(),
                updatedAt: now(),
            };
            write(GROUPS_KEY, [...all, group]);
            return HttpResponse.json({ group }, { status: 201 });
        },
    ),

    http.delete(`${API_URL}/phase-groups/:id`, ({ params }) => {
        if (!getSessionUserId()) {
            return errorResponse(
                401,
                "UNAUTHORIZED",
                "No hay sesión activa",
            );
        }

        const groups = read<PhaseGroup>(GROUPS_KEY);

        if (!groups.some((group) => group.id === params.id)) {
            return errorResponse(
                404,
                "PHASE_GROUP_NOT_FOUND",
                "Grupo no encontrado",
            );
        }

        const groupHasMatches = read<Match>(MATCHES_KEY).some(
            (match) => match.phaseGroupId === params.id,
        );

        if (groupHasMatches) {
            return errorResponse(
                409,
                "PHASE_STRUCTURE_LOCKED",
                "Esta fase ya tiene partidos: elimina primero los partidos del grupo.",
            );
        }

        write(
            GROUPS_KEY,
            groups.filter((group) => group.id !== params.id),
        );

        // Los equipos del grupo eliminado quedan sin grupo.
        write(
            TEAMS_KEY,
            read<PhaseTeam>(TEAMS_KEY).map((team) =>
                team.phaseGroupId === params.id
                    ? { ...team, phaseGroupId: null }
                    : team,
            ),
        );

        return HttpResponse.json({
            message: "Group deleted successfully",
        });
    }),

    http.get(`${API_URL}/phases/:phaseId/teams`, ({ params }) => {
        const teams = read<PhaseTeam>(TEAMS_KEY).filter(
            (t) => t.phaseId === params.phaseId,
        );
        return HttpResponse.json({ teams });
    }),

    http.put(`${API_URL}/phases/:phaseId/teams`, async ({ params, request }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }
        const body = (await request.json()) as { teams?: SyncPhaseTeamItem[] };
        const items = body.teams ?? [];

        const ids = new Set(items.map((i) => i.teamId));
        if (ids.size !== items.length) {
            return errorResponse(
                409,
                "DUPLICATE_PHASE_TEAM",
                "Un equipo solo puede asignarse una vez por fase",
            );
        }

        const rest = read<PhaseTeam>(TEAMS_KEY).filter(
            (t) => t.phaseId !== params.phaseId,
        );
        const fresh: PhaseTeam[] = items.map((i) => ({
            id: crypto.randomUUID(),
            phaseId: params.phaseId as string,
            teamId: i.teamId,
            phaseGroupId: i.phaseGroupId ?? null,
            seed: i.seed ?? null,
            createdAt: now(),
            updatedAt: now(),
        }));
        write(TEAMS_KEY, [...rest, ...fresh]);
        return HttpResponse.json({ teams: fresh });
    }),
];