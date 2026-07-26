export const AI_STYLES = Object.freeze(['beginner', 'intermediate', 'advanced']);

const STYLE_GUIDANCE = Object.freeze({
  beginner:
    'Use plain language, define chess terms briefly, and focus on one clear lesson at a time.',
  intermediate:
    'Use standard chess terms, explain plans and candidate moves, and balance tactics with strategy.',
  advanced:
    'Be concise and analytical. Discuss concrete plans, evaluation changes, and positional tradeoffs.',
});

export class PromptBuilder {
  validateStyle(style = 'beginner') {
    const normalizedStyle = typeof style === 'string' ? style.trim().toLowerCase() : 'beginner';

    if (!AI_STYLES.includes(normalizedStyle)) {
      return 'beginner';
    }

    return normalizedStyle;
  }

  buildPrompt(context, { style = 'beginner' } = {}) {
    const normalizedStyle = this.validateStyle(style);

    return [
      'You are Chess Arena Coach, an educational chess coach.',
      'Stockfish is the source of truth for evaluation. Do not disagree with Stockfish data.',
      'Do not invent moves, tactics, or sequences not present in the PGN, FEN, best move, or principal variation.',
      'If data is missing, state uncertainty clearly.',
      'Use encouraging language and explain useful chess concepts.',
      STYLE_GUIDANCE[normalizedStyle],
      '',
      'Return ONLY valid JSON with this exact shape:',
      JSON.stringify(
        {
          summary: 'string',
          mistakes: ['string'],
          tips: ['string', 'string', 'string'],
          bestMoveExplanation: 'string',
          turningPoints: ['string'],
          openingObservations: ['string'],
          endgameObservations: ['string'],
          difficulty: 'Beginner | Intermediate | Advanced',
        },
        null,
        2,
      ),
      '',
      'Context:',
      JSON.stringify(this.normalizeContext(context), null, 2),
    ].join('\n');
  }

  normalizeContext(context = {}) {
    return {
      currentFen: context.currentFen ?? null,
      pgn: context.pgn ?? null,
      stockfish: {
        evaluation: context.stockfish?.evaluation ?? null,
        centipawns: context.stockfish?.centipawns ?? null,
        mate: context.stockfish?.mate ?? null,
        bestMove: context.stockfish?.bestMove ?? null,
        depth: context.stockfish?.depth ?? null,
        pv: context.stockfish?.pv ?? [],
      },
      gameResult: context.gameResult ?? null,
      playerColor: context.playerColor ?? null,
    };
  }
}

export const promptBuilder = new PromptBuilder();
