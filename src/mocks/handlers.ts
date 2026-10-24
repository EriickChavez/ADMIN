import { authHandlers } from "../features/auth/mocks";
import { categoriesHandlers } from "../features/categories/mocks";
import { brandingHandlers } from "../features/tournaments/mocks/branding";
import { tournamentsHandlers } from "../features/tournaments/mocks";

export const handlers = [
    ...authHandlers,
    ...tournamentsHandlers,
    ...brandingHandlers,
    ...categoriesHandlers,
];