import { authHandlers } from "../features/auth/mocks";
import { categoriesHandlers } from "../features/categories/mocks";
import { tournamentsHandlers } from "../features/tournaments/mocks";

export const handlers = [...authHandlers, ...tournamentsHandlers, ...categoriesHandlers];