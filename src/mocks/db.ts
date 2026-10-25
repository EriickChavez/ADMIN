export const DB_KEYS = {
    matches: "mock_matches",
    matchEvents: "mock_match_events",
} as const;

export function readList<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) as T[];
    } catch {
        // corrupted
    }
    return [];
}

export function writeList<T>(key: string, list: T[]) {
    localStorage.setItem(key, JSON.stringify(list));
}