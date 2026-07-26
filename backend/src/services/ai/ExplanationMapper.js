export class GeminiServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const DEFAULT_EXPLANATION = Object.freeze({
  summary: 'No explanation was generated.',
  mistakes: [],
  tips: [],
  bestMoveExplanation: 'No best-move explanation was generated.',
  turningPoints: [],
  openingObservations: [],
  endgameObservations: [],
  difficulty: 'Intermediate',
});

export class ExplanationMapper {
  mapCached(record) {
    if (!record?.aiGeneratedAt) {
      return null;
    }

    return {
      summary: record.aiSummary,
      mistakes: parseJsonArray(record.aiExplanation),
      tips: parseJsonArray(record.aiTips),
      bestMoveExplanation: record.improvementTips ?? '',
      turningPoints: [],
      openingObservations: [],
      endgameObservations: [],
      difficulty: record.aiDifficulty ?? 'Intermediate',
      style: record.aiStyle,
      generatedAt: record.aiGeneratedAt?.toISOString?.() ?? record.aiGeneratedAt,
      cached: true,
    };
  }

  mapGenerated(rawText, { style }) {
    const parsed = this.parseJsonObject(rawText);
    const explanation = {
      ...DEFAULT_EXPLANATION,
      ...parsed,
      style,
      generatedAt: new Date().toISOString(),
      cached: false,
    };

    return {
      summary: ensureString(explanation.summary, DEFAULT_EXPLANATION.summary),
      mistakes: ensureStringArray(explanation.mistakes),
      tips: ensureStringArray(explanation.tips).slice(0, 3),
      bestMoveExplanation: ensureString(
        explanation.bestMoveExplanation,
        DEFAULT_EXPLANATION.bestMoveExplanation,
      ),
      turningPoints: ensureStringArray(explanation.turningPoints),
      openingObservations: ensureStringArray(explanation.openingObservations),
      endgameObservations: ensureStringArray(explanation.endgameObservations),
      difficulty: ensureString(explanation.difficulty, DEFAULT_EXPLANATION.difficulty),
      style,
      generatedAt: explanation.generatedAt,
      cached: false,
    };
  }

  parseJsonObject(rawText) {
    if (typeof rawText !== 'string' || rawText.trim().length === 0) {
      throw new GeminiServiceError(
        'GEMINI_RESPONSE_INVALID',
        'Gemini returned an empty response.',
        502,
      );
    }

    const trimmed = rawText.trim();
    const jsonText = trimmed.startsWith('```')
      ? trimmed
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/i, '')
          .trim()
      : trimmed;

    try {
      return JSON.parse(jsonText);
    } catch {
      throw new GeminiServiceError(
        'GEMINI_RESPONSE_INVALID',
        'Gemini returned a response that could not be parsed.',
        502,
      );
    }
  }

  toDatabaseValues(explanation) {
    return {
      aiDifficulty: explanation.difficulty,
      aiExplanation: JSON.stringify(explanation.mistakes),
      aiGeneratedAt: new Date(explanation.generatedAt),
      aiStyle: explanation.style,
      aiSummary: explanation.summary,
      aiTips: JSON.stringify(explanation.tips),
      improvementTips: explanation.bestMoveExplanation,
      summary: explanation.summary,
    };
  }
}

function ensureString(value, fallback) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function ensureStringArray(value) {
  return Array.isArray(value)
    ? value
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    : [];
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return ensureStringArray(parsed);
  } catch {
    return [];
  }
}

export const explanationMapper = new ExplanationMapper();
