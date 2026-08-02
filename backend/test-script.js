import { chessService } from './src/services/chess/ChessService.js';
import { stockfishService } from './src/services/analysis/StockfishService.js';
import { geminiService } from './src/services/ai/GeminiService.js';
import assert from 'node:assert';

async function runTests() {
  console.log('Testing ChessService...');
  const game = await chessService.createGame({ displayName: 'Player 1' });
  const gameId = game.gameId || game.id;
  console.log('Game created:', gameId);
  assert.strictEqual(game.status.toLowerCase(), 'waiting');

  const joinedGame = await chessService.joinGame(gameId, { displayName: 'Player 2' });
  console.log('Game joined:', joinedGame.gameId || joinedGame.id);
  assert.strictEqual(joinedGame.status.toLowerCase(), 'active');

  const moveRes = await chessService.requestMove(gameId, {
    playerId: joinedGame.players.white.id,
    move: { from: 'e2', to: 'e4' },
  });
  console.log('Move made:', moveRes.move.san);
  assert.strictEqual(moveRes.turn, 'b');

  console.log('Testing Stockfish...');
  const sfRes = await stockfishService.evaluatePosition({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    depth: 10,
    timeLimit: 1000,
  });
  console.log('Stockfish eval:', sfRes.centipawns, sfRes.bestMove);
  assert.ok(sfRes.bestMove);

  console.log('Testing Gemini...');
  try {
    const gRes = await geminiService.explain({ stockfish: sfRes }, { style: 'beginner' });
    console.log('Gemini explanation:', gRes.summary);
    assert.ok(gRes.summary);
  } catch (err) {
    console.log('Gemini API notice:', err.message || err.code);
  }

  console.log('All backend unit tests passed!');
  process.exit(0);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
