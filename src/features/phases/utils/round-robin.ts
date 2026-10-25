export interface RoundRobinFixture<T> {
    round: number;
    home: T;
    away: T;
}

/**
 * Todos contra todos (método del círculo). Con 4 equipos: 3 jornadas de 2 partidos.
 * Con un número impar de equipos, uno descansa cada jornada.
 */
export function roundRobin<T>(items: T[]): RoundRobinFixture<T>[] {
    const list: (T | null)[] = [...items];
    if (list.length % 2 === 1) list.push(null);

    const size = list.length;
    const fixtures: RoundRobinFixture<T>[] = [];

    for (let round = 0; round < size - 1; round += 1) {
        for (let i = 0; i < size / 2; i += 1) {
            const a = list[i];
            const b = list[size - 1 - i];
            if (a == null || b == null) continue;
            // Alterna local/visitante del primer cruce para repartir localías.
            const swap = i === 0 && round % 2 === 1;
            fixtures.push({
                round: round + 1,
                home: swap ? b : a,
                away: swap ? a : b,
            });
        }
        // El primero queda fijo y el resto rota.
        const last = list.pop();
        if (last !== undefined) list.splice(1, 0, last);
    }

    return fixtures;
}