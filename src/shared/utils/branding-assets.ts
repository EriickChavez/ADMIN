const BRANDING_URL =
    import.meta.env.VITE_BRANDING_URL?.trim().replace(/\/+$/, "");

export function resolveBrandingAsset(
    path: string | null | undefined,
): string | null {
    if (!path) return null;

    if (/^(https?:|data:|blob:)/i.test(path)) {
        return path;
    }

    return `${BRANDING_URL}/${path.replace(/^\/+/, "")}`;
}