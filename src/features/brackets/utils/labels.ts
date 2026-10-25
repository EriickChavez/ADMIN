import type { BracketNode } from "../types";

/** Cuántos cruces tiene cada ronda del cuadro principal. */
export function buildRoundSizes(nodes: BracketNode[]): Map<number, number> {
    const sizes = new Map<number, number>();
    for (const node of nodes) {
        if (node.stage !== "main") continue;
        sizes.set(node.round, (sizes.get(node.round) ?? 0) + 1);
    }
    return sizes;
}

/** El nombre de una ronda sale de cuántos cruces tiene: 1 = final, 2 = semifinales... */
export function mainRoundLabel(nodesInRound: number): string {
    switch (nodesInRound) {
        case 1:
            return "Final";
        case 2:
            return "Semifinales";
        case 4:
            return "Cuartos de final";
        case 8:
            return "Octavos de final";
        case 16:
            return "Dieciseisavos de final";
        default:
            return `Ronda de ${nodesInRound * 2}`;
    }
}

export function nodeStageLabel(
    node: BracketNode,
    roundSizes: Map<number, number>,
): string {
    if (node.stage === "play_in") return "Repechaje";
    if (node.stage === "third_place") return "Tercer lugar";
    return mainRoundLabel(roundSizes.get(node.round) ?? 0);
}

/** Texto para un lado del cruce cuyo equipo todavía no se conoce. */
export function describeSource(
    source: BracketNode["homeSource"],
    nodeById: Map<string, BracketNode>,
    roundSizes: Map<number, number>,
): string {
    if (!source) return "Por definir";
    const origin = nodeById.get(source.nodeId);
    if (!origin) return "Por definir";
    const kind = source.kind === "winner" ? "Ganador" : "Perdedor";
    return `${kind} de ${nodeStageLabel(origin, roundSizes)} ${origin.position + 1}`;
}