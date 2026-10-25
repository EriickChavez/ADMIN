import { authHandlers } from "../features/auth/mocks";
import { categoriesHandlers } from "../features/categories/mocks";
import { teamsHandlers } from "../features/teams/mocks";
import { playersHandlers } from "../features/players/mocks";
import { phasesHandlers } from "../features/phases/mocks";
import { brandingHandlers } from "../features/tournaments/mocks/branding";
import { tournamentsHandlers } from "../features/tournaments/mocks";
import { phaseStructureHandlers } from "../features/phases/mocks-structure";
import { matchesHandlers } from "../features/matches/mocks";
import { matchEventsHandlers } from "../features/match-events/mocks";

export const handlers = [
    ...authHandlers,
    ...tournamentsHandlers,
    ...brandingHandlers,
    ...categoriesHandlers,
    ...teamsHandlers,
    ...playersHandlers,
    ...phasesHandlers,
    ...phaseStructureHandlers,
    ...matchesHandlers,
    ...matchEventsHandlers,
];