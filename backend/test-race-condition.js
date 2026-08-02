import { io } from 'socket.io-client';

const URL = 'http://localhost:4000';

async function runTest() {
  console.log('--- Race Condition Verification ---');

  const socketWhite = io(URL);
  await new Promise((resolve) => {
    if (socketWhite.connected) resolve();
    else socketWhite.on('connect', resolve);
  });

  const createRes = await new Promise((resolve) => {
    socketWhite.emit('create_game', { displayName: 'WhitePlayer' }, resolve);
  });
  const gameId = createRes.data.game.gameId;
  const whitePlayerId = createRes.data.game.whitePlayer.id;

  const socketBlack = io(URL);
  await new Promise((resolve) => {
    if (socketBlack.connected) resolve();
    else socketBlack.on('connect', resolve);
  });
  await new Promise((resolve) => {
    socketBlack.emit('join_game', { displayName: 'BlackPlayer', gameId }, resolve);
  });

  console.log('Sending two concurrent moves from White (duplicate submissions)...');

  const promise1 = new Promise((resolve) => {
    socketWhite.emit(
      'make_move',
      {
        gameId,
        playerId: whitePlayerId,
        move: { from: 'e2', to: 'e4' },
      },
      resolve,
    );
  });

  const promise2 = new Promise((resolve) => {
    socketWhite.emit(
      'make_move',
      {
        gameId,
        playerId: whitePlayerId,
        move: { from: 'g1', to: 'f3' },
      },
      resolve,
    );
  });

  const [res1, res2] = await Promise.all([promise1, promise2]);

  console.log('Move 1 result:', res1.success ? 'Accepted' : 'Rejected');
  console.log('Move 2 result:', res2.success ? 'Accepted' : 'Rejected');

  const stateRes = await new Promise((resolve) => {
    socketWhite.emit('request_game_state', { gameId, playerId: whitePlayerId }, resolve);
  });

  console.log('Final move history length:', stateRes.data.game.moveHistory.length);

  if (res1.success && res2.success) {
    console.error('FAIL: Race condition detected! Both conflicting moves were accepted.');
  } else {
    console.log('PASS: Race conditions are correctly prevented.');
  }

  process.exit(0);
}

runTest().catch(console.error);
