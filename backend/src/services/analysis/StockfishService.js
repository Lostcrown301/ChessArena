import stockfish from 'stockfish';
import { Chess } from 'chess.js';
import { logger as defaultLogger } from '../../config/logger.js';
import { AnalysisServiceError, evaluationMapper } from './EvaluationMapper.js';

const DEFAULT_DEPTH = 15;
const DEFAULT_TIME_LIMIT_MS = 5000;
const MAX_DEPTH = 24;
const MAX_TIME_LIMIT_MS = 30000;
const MULTI_PV = 3;

export class StockfishService {
  constructor({
    engineFactory = stockfish,
    logger = defaultLogger,
    mapper = evaluationMapper,
  } = {}) {
    this.engineFactory = engineFactory;
    this.logger = logger;
    this.mapper = mapper;
    this.engine = null;
    this.initializing = null;
  }

  async initialize() {
    if (this.engine) {
      return this.engine;
    }

    if (!this.initializing) {
      this.initializing = this.engineFactory('lite-single')
        .then((engine) => {
          this.engine = engine;
          this.logger.info('Stockfish engine initialized');
          return engine;
        })
        .catch((error) => {
          this.initializing = null;
          this.logger.error({ err: error }, 'Stockfish engine initialization failed');
          throw new AnalysisServiceError(
            'ENGINE_UNAVAILABLE',
            'Stockfish engine could not be initialized.',
            503,
          );
        });
    }

    return this.initializing;
  }

  async shutdown() {
    if (!this.engine) {
      return;
    }

    try {
      this.engine.sendCommand('quit');
      this.logger.info('Stockfish engine shut down');
    } finally {
      this.engine = null;
      this.initializing = null;
    }
  }

  async evaluatePosition({ depth = DEFAULT_DEPTH, fen, timeLimit = DEFAULT_TIME_LIMIT_MS }) {
    const normalizedInput = this.validateInput({ depth, fen, timeLimit });

    if (normalizedInput.chess.isCheckmate()) {
      return {
        evaluation: null,
        centipawns: null,
        mate: 0,
        bestMove: null,
        depth: 0,
        nodes: 0,
        pv: [],
        topVariations: [],
        analyzedAt: new Date().toISOString(),
        durationMs: 0,
      };
    }

    const engine = await this.initialize();
    const startedAt = Date.now();
    const lines = new Map();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        this.safeStop();
        this.engine = null;
        this.initializing = null;
        reject(new AnalysisServiceError('ENGINE_TIMEOUT', 'Stockfish analysis timed out.', 504));
      }, normalizedInput.timeLimit + 5000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        engine.listener = () => {};
      };

      engine.listener = (line) => {
        try {
          const parsedLine = this.mapper.parseInfoLine(line);

          if (parsedLine) {
            lines.set(parsedLine.multipv, parsedLine);
          }

          if (line.startsWith('bestmove ')) {
            cleanup();
            resolve(
              this.mapper.mapResult({
                bestMove: line.split(/\s+/)[1] ?? null,
                lines,
                requestedDepth: normalizedInput.depth,
                startedAt,
              }),
            );
          }
        } catch (error) {
          cleanup();
          reject(
            new AnalysisServiceError(
              'ENGINE_RESPONSE_INVALID',
              error.message ?? 'Stockfish returned an invalid response.',
              502,
            ),
          );
        }
      };

      try {
        engine.sendCommand('ucinewgame');
        engine.sendCommand(`setoption name MultiPV value ${MULTI_PV}`);
        engine.sendCommand('isready');
        engine.sendCommand(`position fen ${normalizedInput.fen}`);
        engine.sendCommand(
          normalizedInput.timeLimit
            ? `go depth ${normalizedInput.depth} movetime ${normalizedInput.timeLimit}`
            : `go depth ${normalizedInput.depth}`,
        );
      } catch (error) {
        cleanup();
        this.engine = null;
        this.initializing = null;
        reject(
          new AnalysisServiceError(
            'ENGINE_CRASHED',
            error.message ?? 'Stockfish failed while analyzing the position.',
            502,
          ),
        );
      }
    });
  }

  validateInput({ depth, fen, timeLimit }) {
    if (typeof fen !== 'string' || fen.trim().length === 0) {
      throw new AnalysisServiceError('INVALID_FEN', 'FEN is required.');
    }

    let chess;

    try {
      chess = new Chess(fen.trim());
    } catch {
      throw new AnalysisServiceError('INVALID_FEN', 'FEN is invalid.');
    }

    const normalizedDepth = Number(depth ?? DEFAULT_DEPTH);
    const normalizedTimeLimit = Number(timeLimit ?? DEFAULT_TIME_LIMIT_MS);

    if (!Number.isInteger(normalizedDepth) || normalizedDepth < 1 || normalizedDepth > MAX_DEPTH) {
      throw new AnalysisServiceError(
        'INVALID_DEPTH',
        `Depth must be an integer between 1 and ${MAX_DEPTH}.`,
      );
    }

    if (
      !Number.isInteger(normalizedTimeLimit) ||
      normalizedTimeLimit < 100 ||
      normalizedTimeLimit > MAX_TIME_LIMIT_MS
    ) {
      throw new AnalysisServiceError(
        'INVALID_TIME_LIMIT',
        `timeLimit must be an integer between 100 and ${MAX_TIME_LIMIT_MS} milliseconds.`,
      );
    }

    return {
      chess,
      depth: normalizedDepth,
      fen: fen.trim(),
      timeLimit: normalizedTimeLimit,
    };
  }

  safeStop() {
    try {
      this.engine?.sendCommand('stop');
    } catch (error) {
      this.logger.warn({ err: error }, 'Unable to stop Stockfish search');
    }
  }
}

export const stockfishService = new StockfishService();
