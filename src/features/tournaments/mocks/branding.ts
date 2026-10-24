import { http, HttpResponse } from "msw";
import { API_URL } from "../../../api/client";
import { getSessionUserId } from "../../../mocks/session";
import { errorResponse } from "../../../mocks/utils";
import type { TournamentBranding } from "../types";

const BRANDING_KEY = "mock_branding";

type StoredBranding = TournamentBranding;

const getAll = (): Record<string, StoredBranding> => {
    try {
        const raw = localStorage.getItem(BRANDING_KEY);
        if (raw) return JSON.parse(raw) as Record<string, StoredBranding>;
    } catch {
        // corrupted → empty
    }
    return {};
};

const saveAll = (map: Record<string, StoredBranding>) =>
    localStorage.setItem(BRANDING_KEY, JSON.stringify(map));

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const LOGO_MAX = 2 * 1024 * 1024;
const BANNER_MAX = 5 * 1024 * 1024;

async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export const brandingHandlers = [
    http.get(`${API_URL}/tournaments/:id/branding`, ({ params }) => {
        const userId = getSessionUserId();
        if (!userId) return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");

        const all = getAll();
        const branding = all[params.id as string];
        if (!branding) {
            return errorResponse(404, "BRANDING_NOT_FOUND", "Tournament branding not found.");
        }
        return HttpResponse.json({ branding });
    }),

    http.patch(`${API_URL}/tournaments/:id/branding`, async ({ params, request }) => {
        const userId = getSessionUserId();
        if (!userId) return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");

        const tournamentId = params.id as string;
        const form = await request.formData();
        const logo = form.get("logo");
        const banner = form.get("banner");

        const logoFile = logo instanceof File && logo.size > 0 ? logo : null;
        const bannerFile = banner instanceof File && banner.size > 0 ? banner : null;

        if (!logoFile && !bannerFile) {
            return errorResponse(400, "NO_FILE_PROVIDED", "Debes subir al menos un archivo");
        }

        if (logoFile) {
            if (!ALLOWED_TYPES.has(logoFile.type)) {
                return errorResponse(400, "INVALID_FILE_TYPE", "Solo se permiten PNG, JPEG o WebP");
            }
            if (logoFile.size > LOGO_MAX) {
                return errorResponse(400, "FILE_TOO_LARGE", "El logo no puede superar 2 MB");
            }
        }

        if (bannerFile) {
            if (!ALLOWED_TYPES.has(bannerFile.type)) {
                return errorResponse(400, "INVALID_FILE_TYPE", "Solo se permiten PNG, JPEG o WebP");
            }
            if (bannerFile.size > BANNER_MAX) {
                return errorResponse(400, "FILE_TOO_LARGE", "El banner no puede superar 5 MB");
            }
        }

        const all = getAll();
        const current = all[tournamentId] ?? {
            tournamentId,
            logoUrl: null,
            bannerUrl: null,
            updatedAt: new Date().toISOString(),
        };

        const updated: StoredBranding = {
            ...current,
            updatedAt: new Date().toISOString(),
        };

        if (logoFile) {
            updated.logoUrl = await fileToDataUrl(logoFile);
        }
        if (bannerFile) {
            updated.bannerUrl = await fileToDataUrl(bannerFile);
        }

        saveAll({ ...all, [tournamentId]: updated });

        // Also sync branding into the tournament list mock so useMyTournament sees it
        try {
            const TOURNAMENTS_KEY = "mock_tournaments";
            const raw = localStorage.getItem(TOURNAMENTS_KEY);
            if (raw) {
                const list = JSON.parse(raw) as Array<{
                    id: string;
                    branding: TournamentBranding | null;
                }>;
                const next = list.map((t) =>
                    t.id === tournamentId ? { ...t, branding: updated } : t,
                );
                localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(next));
            }
        } catch {
            // ignore
        }

        return HttpResponse.json({ branding: updated });
    }),
];