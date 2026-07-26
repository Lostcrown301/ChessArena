import { env } from '../../config/env.js';
import { logger as defaultLogger } from '../../config/logger.js';
import { explanationMapper, GeminiServiceError } from './ExplanationMapper.js';
import { promptBuilder } from './PromptBuilder.js';

const DEFAULT_TIMEOUT_MS = 15000;

export class GeminiService {
  constructor({
    apiKey = env.geminiApiKey,
    endpoint = env.geminiApiEndpoint,
    fetchClient = fetch,
    logger = defaultLogger,
    mapper = explanationMapper,
    model = env.geminiModel,
    prompts = promptBuilder,
  } = {}) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.fetchClient = fetchClient;
    this.logger = logger;
    this.mapper = mapper;
    this.model = model;
    this.prompts = prompts;
  }

  /**
   * Generates a natural language chess coaching explanation from a given evaluation context.
   * Includes an exponential backoff retry loop for rate limits and server errors.
   * @param {Object} context - The analysis context (PGN, FEN, Stockfish eval).
   * @param {Object} options
   * @param {string} [options.style='beginner'] - The coaching style ('beginner', 'intermediate', 'advanced').
   * @param {number} [options.timeoutMs=15000] - Request timeout.
   * @returns {Promise<Object>} The mapped explanation object.
   * @throws {GeminiServiceError} If generation fails or times out.
   */
  async explain(context, { style = 'beginner', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const normalizedStyle = this.prompts.validateStyle(style);

    if (!this.apiKey) {
      if (env.nodeEnv === 'production') {
        throw new GeminiServiceError(
          'GEMINI_UNAVAILABLE',
          'Gemini API key is not configured.',
          503,
        );
      }

      return this.createDevelopmentExplanation(context, normalizedStyle);
    }

    let attempt = 0;
    const maxAttempts = 3;
    let lastError;

    while (attempt < maxAttempts) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await this.fetchClient(this.buildUrl(), {
          body: JSON.stringify(this.buildRequestBody(context, normalizedStyle)),
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          method: 'POST',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw await this.mapHttpError(response);
        }

        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
        return this.mapper.mapGenerated(text, { style: normalizedStyle });
      } catch (error) {
        lastError = error;

        if (error.name === 'AbortError') {
          lastError = new GeminiServiceError('GEMINI_TIMEOUT', 'Gemini explanation timed out.', 504);
        } else if (!(error instanceof GeminiServiceError)) {
          this.logger.error({ err: error }, 'Gemini explanation failed');
          lastError = new GeminiServiceError('GEMINI_UNAVAILABLE', 'Gemini is unavailable.', 503);
        }

        const isRetryable = lastError.statusCode === 429 || lastError.statusCode >= 500;
        if (!isRetryable || attempt >= maxAttempts) {
          throw lastError;
        }

        // Exponential backoff
        const backoffMs = Math.pow(2, attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  buildUrl() {
    return `${this.endpoint}/models/${encodeURIComponent(this.model)}:generateContent`;
  }

  buildRequestBody(context, style) {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: this.prompts.buildPrompt(context, { style }),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      },
    };
  }

  async mapHttpError(response) {
    if (response.status === 429) {
      return new GeminiServiceError('GEMINI_RATE_LIMITED', 'Gemini rate limit reached.', 429);
    }

    if (response.status === 400) {
      return new GeminiServiceError('GEMINI_REQUEST_INVALID', 'Gemini rejected the prompt.', 400);
    }

    if (response.status >= 500) {
      return new GeminiServiceError('GEMINI_UNAVAILABLE', 'Gemini is unavailable.', 503);
    }

    return new GeminiServiceError(
      'GEMINI_REQUEST_FAILED',
      'Gemini request failed.',
      response.status,
    );
  }

  createDevelopmentExplanation(context, style) {
    const bestMove = context.stockfish?.bestMove ?? 'the engine move';
    return {
      summary:
        'Development coaching fallback: Stockfish data is available, but no Gemini API key is configured.',
      mistakes: ['Review the moments where the engine evaluation changed most sharply.'],
      tips: [
        'Compare your candidate move with the Stockfish best move before moving.',
        'Look for forcing checks, captures, and threats in every critical position.',
        'Use the principal variation as a guide, not as a move sequence to memorize.',
      ],
      bestMoveExplanation: `Stockfish prefers ${bestMove}. Treat this as the trusted engine recommendation.`,
      turningPoints: ['Use the PGN and evaluation together to identify the main turning point.'],
      openingObservations: ['Develop pieces and keep king safety in mind.'],
      endgameObservations: ['Convert advantages with active pieces and clear plans.'],
      difficulty:
        style === 'advanced' ? 'Advanced' : style === 'intermediate' ? 'Intermediate' : 'Beginner',
      style,
      generatedAt: new Date().toISOString(),
      cached: false,
    };
  }
}

export const geminiService = new GeminiService();
