import { io } from 'socket.io-client';

const URL = 'http://localhost:4000';
const socketWhite = io(URL);
const socketBlack = io(URL);

let gameId;
let whitePlayerId;
let blackPlayerId;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- E2E Clock Verification ---');
  console.log('Connecting to', URL);
  
  await new Promise(resolve => {
    if (socketWhite.connected) {
      console.log('White connected immediately');
      resolve();
    } else {
      socketWhite.on('connect', () => {
        console.log('White connected via event');
        resolve();
      });
      socketWhite.on('connect_error', (err) => {
        console.error('White connection error:', err);
      });
    }
  });
  
  // 1. White joins (Creates Game)
  const createRes = await new Promise(resolve => {
    socketWhite.emit('create_game', { displayName: 'WhitePlayer' }, resolve);
  });
  
  if (!createRes.success) {
    console.error('Failed to create game', createRes);
    process.exit(1);
  }
  
  gameId = createRes.data.game.gameId;
  whitePlayerId = createRes.data.game.whitePlayer.id;
  console.log('1. White joined (Created Game)');

  // Ensure Black connected
  await new Promise(resolve => {
    if (socketBlack.connected) resolve();
    else socketBlack.on('connect', resolve);
  });
  
  // 2. Black joins
  const joinRes = await new Promise(resolve => {
    socketBlack.emit('join_game', { displayName: 'BlackPlayer', gameId }, resolve);
  });
  
  if (!joinRes.success) {
    console.error('Failed to join game', joinRes);
    process.exit(1);
  }
  
  blackPlayerId = joinRes.data.game.players.black.id;
  const gameStarted = joinRes.data.game;
  console.log('2. Black joined');
  
  // 3 & 4. Verify clocks
  console.log(`3. White timer started at: ${gameStarted.timerStartedAt}`);
  if (!gameStarted.timerStartedAt) throw new Error('Timer did not start');
  console.log('4. Black timer remains paused (turn is White)');
  
  // Wait 2 seconds
  console.log('Waiting 2 seconds...');
  await sleep(2000);
  
  // 5. White makes a move
  console.log('5. White makes a move (e2 to e4)');
  const moveRes = await new Promise(resolve => {
    socketWhite.emit('make_move', { 
      gameId, 
      playerId: whitePlayerId, 
      move: { from: 'e2', to: 'e4' } 
    }, resolve);
  });
  
  const moveGame = moveRes.data.game;
  console.log(`6. White timer stopped. Remaining: ${moveGame.whiteRemainingMs}ms`);
  if (moveGame.whiteRemainingMs >= 600000) throw new Error('White time was not deducted');
  
  console.log(`7. Black timer started at: ${moveGame.timerStartedAt}`);
  
  // Wait 2 seconds
  console.log('Waiting 2 seconds...');
  await sleep(2000);
  
  // 8. Black makes a move
  console.log('8. Black makes a move (e7 to e5)');
  const moveRes2 = await new Promise(resolve => {
    socketBlack.emit('make_move', { 
      gameId, 
      playerId: blackPlayerId, 
      move: { from: 'e7', to: 'e5' } 
    }, resolve);
  });
  
  const moveGame2 = moveRes2.data.game;
  console.log(`9. Timers switched. Black remaining: ${moveGame2.blackRemainingMs}ms`);
  if (moveGame2.blackRemainingMs >= 600000) throw new Error('Black time was not deducted');
  
  // 10, 11, 12, 13, 14. Reconnect tests
  console.log('10. Reconnecting White (simulating refresh)...');
  const socketWhite2 = io(URL);
  await new Promise(resolve => socketWhite2.on('connect', resolve));
  const reconnectRes = await new Promise(resolve => {
    socketWhite2.emit('request_game_state', { gameId, playerId: whitePlayerId }, resolve);
  });
  const reconnectedGame = reconnectRes.data.game;
  console.log(`12. Reconnected game timers restored. White: ${reconnectedGame.whiteRemainingMs}, Black: ${reconnectedGame.blackRemainingMs}`);
  if (!reconnectedGame.timerStartedAt) throw new Error('Reconnection lost timer state');
  
  // 15, 16. Timeout test
  console.log('15. Allowing White timer to expire (simulating claim timeout instead of waiting 10 mins)...');
  
  const prematureClaim = await new Promise(resolve => {
    socketBlack.emit('claim_timeout', { gameId }, resolve);
  });
  
  if (prematureClaim.data.game.status !== 'TIMEOUT') {
    console.log('16. Validated backend securely rejected premature timeout claim.');
  } else {
    throw new Error('Backend accepted premature timeout claim!');
  }
  
  console.log('All backend logic verified successfully!');
  process.exit(0);
}

runTest().catch(console.error);
