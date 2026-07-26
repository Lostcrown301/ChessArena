import { chessService } from './backend/src/services/chess/ChessService.js';
import { stockfishService } from './backend/src/services/analysis/StockfishService.js';
import { geminiService } from './backend/src/services/ai/GeminiService.js';
import { historyService } from './backend/src/services/history/HistoryService.js';
import { gameStore } from './backend/src/services/chess/store/StoreFactory.js';
import assert from 'node:assert';

async function runTests() {
  console.log('Testing ChessService...');
  const game = await chessService.createGame({ displayName: 'Player 1' });
  console.log('Game created:', game.id);
  assert.strictEqual(game.status, 'waiting');

  const joinedGame = await chessService.joinGame(game.id, { displayName: 'Player 2' });
  console.log('Game joined:', joinedGame.id);
  assert.strictEqual(joinedGame.status, 'active');

  const moveRes = await chessService.requestMove(game.id, { 
    playerId: joinedGame.players.w.id, 
    move: { from: 'e2', to: 'e4' } 
  });
  console.log('Move made:', moveRes.move.san);
  assert.strictEqual(moveRes.game.turn, 'b');

  console.log('Testing Stockfish...');
  const sfRes = await stockfishService.evaluatePosition({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', depth: 10, timeLimit: 1000 });
  console.log('Stockfish eval:', sfRes.centipawns, sfRes.bestMove);
  assert.ok(sfRes.bestMove);

  console.log('Testing Gemini...');
  const gRes = await geminiService.explain({ stockfish: sfRes }, { style: 'beginner' });
  console.log('Gemini explanation:', gRes.summary);
  assert.ok(gRes.summary);
  
  console.log('All backend unit tests passed!');
  process.exit(0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
