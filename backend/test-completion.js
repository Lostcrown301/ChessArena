import { io } from 'socket.io-client';

const URL = 'http://localhost:4000';

async function runTest() {
  console.log('--- Completion Verification ---');
  
  const socketWhite = io(URL);
  await new Promise(resolve => {
    if (socketWhite.connected) resolve();
    else socketWhite.on('connect', resolve);
  });
  
  const createRes = await new Promise(resolve => {
    socketWhite.emit('create_game', { displayName: 'WhitePlayer' }, resolve);
  });
  const gameId = createRes.data.game.gameId;
  const whitePlayerId = createRes.data.game.whitePlayer.id;

  const socketBlack = io(URL);
  await new Promise(resolve => {
    if (socketBlack.connected) resolve();
    else socketBlack.on('connect', resolve);
  });
  await new Promise(resolve => {
    socketBlack.emit('join_game', { displayName: 'BlackPlayer', gameId }, resolve);
  });
  
  console.log('Players joined. White resigning...');
  
  const resignRes = await new Promise(resolve => {
    socketWhite.emit('resign_game', { gameId, playerId: whitePlayerId }, resolve);
  });
  
  console.log('Resign result:', resignRes.success ? 'Success' : 'Failed');
  if (!resignRes.success) {
    console.error('Error:', resignRes);
  } else {
    console.log('Game status:', resignRes.data.game.status);
    console.log('Game should be archived to PostgreSQL now!');
  }
  
  process.exit(0);
}

runTest().catch(console.error);
