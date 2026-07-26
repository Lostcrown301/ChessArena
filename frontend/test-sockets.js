import { io } from 'socket.io-client';

const socket1 = io('http://localhost:4000');
const socket2 = io('http://localhost:4000');

let gameId;
let whitePlayerId;
let blackPlayerId;

socket1.on('connect', () => {
  console.log('White connected');
  socket1.emit('game:create', { displayName: 'WhitePlayer' }, (res) => {
    console.log('GAME CREATED', res?.success);
    gameId = res.data.game.gameId;
    whitePlayerId = res.data.game.whitePlayer.id;

    socket2.on('connect', () => {
      console.log('Black connected');
      socket2.emit('game:join', { displayName: 'BlackPlayer', gameId }, (res2) => {
        console.log('GAME JOINED', res2?.success);
        blackPlayerId = res2.data.game.players.black.id;

        console.log('--- WHITE MOVES ---');
        socket1.emit('game:move', { 
          gameId, 
          playerId: whitePlayerId, 
          move: { from: 'e2', to: 'e4' } 
        }, (res3) => {
          console.log('WHITE MOVE ACK:', res3?.success);
        });
      });
    });
  });
});

socket2.on('game:board_updated', (payload) => {
  console.log('BLACK RECEIVED BOARD_UPDATED');
  console.log('FEN:', payload.data.fen);
  console.log('TURN:', payload.data.turn);
  console.log('GAME.FEN:', payload.data.game.fen);
  console.log('GAME.TURN:', payload.data.game.turn);
  process.exit(0);
});
