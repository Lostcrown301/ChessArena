export class AnalysisServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'AnalysisServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class EvaluationMapper {
  mapResult({ bestMove, lines, requestedDepth, startedAt }) {
    const primaryLine = lines.get(1) ?? null;
    const depth = Math.max(...[...lines.values()].map((line) => line.depth), requestedDepth);
    const nodes = Math.max(0, ...[...lines.values()].map((line) => line.nodes ?? 0));
    const mate = primaryLine?.mate ?? null;
    const centipawns = primaryLine?.centipawns ?? null;
    const evaluation =
      mate === null && centipawns !== null ? Number((centipawns / 100).toFixed(2)) : null;

    return {
      evaluation,
      centipawns,
      mate,
      bestMove,
      depth,
      nodes,
      pv: primaryLine?.pv ?? [],
      topVariations: [...lines.entries()]
        .sort(([left], [right]) => left - right)
        .slice(0, 3)
        .map(([multipv, line]) => ({
          multipv,
          evaluation:
            line.mate === null && line.centipawns !== null
              ? Number((line.centipawns / 100).toFixed(2))
              : null,
          centipawns: line.centipawns,
          mate: line.mate,
          depth: line.depth,
          nodes: line.nodes,
          pv: line.pv,
        })),
      analyzedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    };
  }

  parseInfoLine(line) {
    if (!line.startsWith('info ') || !line.includes(' pv ')) {
      return null;
    }

    const tokens = line.split(/\s+/);
    const depth = readNumberAfter(tokens, 'depth') ?? 0;
    const multipv = readNumberAfter(tokens, 'multipv') ?? 1;
    const nodes = readNumberAfter(tokens, 'nodes') ?? 0;
    const scoreIndex = tokens.indexOf('score');
    const pvIndex = tokens.indexOf('pv');
    const scoreType = scoreIndex >= 0 ? tokens[scoreIndex + 1] : null;
    const scoreValue = scoreIndex >= 0 ? Number(tokens[scoreIndex + 2]) : null;

    return {
      centipawns: scoreType === 'cp' && Number.isFinite(scoreValue) ? scoreValue : null,
      depth,
      mate: scoreType === 'mate' && Number.isFinite(scoreValue) ? scoreValue : null,
      multipv,
      nodes,
      pv: pvIndex >= 0 ? tokens.slice(pvIndex + 1) : [],
    };
  }
}

function readNumberAfter(tokens, marker) {
  const index = tokens.indexOf(marker);
  const value = index >= 0 ? Number(tokens[index + 1]) : null;
  return Number.isFinite(value) ? value : null;
}

export const evaluationMapper = new EvaluationMapper();
