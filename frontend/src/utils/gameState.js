import { ACTIVE_GAME_STATUSES, TERMINAL_GAME_STATUSES } from '@constants/gameUi';

const PIECE_SYMBOLS = {
  b: 'B',
  k: 'K',
  n: 'N',
  p: 'P',
  q: 'Q',
  r: 'R',
};

export function getLastMove(game) {
  return game?.moveHistory?.at(-1) ?? null;
}

export function getPlayerWithColor(game, color) {
  const player = game?.players?.[color] ?? game?.[`${color}Player`] ?? null;

  return player
    ? {
        ...player,
        color: color === 'white' ? 'White' : 'Black',
      }
    : {
        color: color === 'white' ? 'White' : 'Black',
        connected: false,
        displayName: 'Waiting for player',
      };
}

export function getCapturedPieces(game) {
  return (game?.moveHistory ?? []).reduce(
    (captures, move) => {
      if (!move.captured) {
        return captures;
      }

      const symbol = PIECE_SYMBOLS[move.captured] ?? move.captured.toUpperCase();

      if (move.color === 'w') {
        captures.white.push(symbol);
      } else {
        captures.black.push(symbol.toLowerCase());
      }

      return captures;
    },
    { black: [], white: [] },
  );
}

export function isTerminalGame(game) {
  return TERMINAL_GAME_STATUSES.includes(game?.status);
}

export function isGameActive(game) {
  return Boolean(
    game?.players?.white && game?.players?.black && ACTIVE_GAME_STATUSES.includes(game.status),
  );
}

export function isCurrentPlayerTurn(game, playerColor) {
  if (!playerColor) {
    return false;
  }

  return (
    (game?.turn === 'w' && playerColor === 'white') ||
    (game?.turn === 'b' && playerColor === 'black')
  );
}

export function canCurrentPlayerMove({ game, isConnected, playerColor }) {
  return Boolean(isConnected && isGameActive(game) && isCurrentPlayerTurn(game, playerColor));
}

export function isDrawOfferForPlayer(game, playerId) {
  return Boolean(game?.drawOffer?.offeredTo && game.drawOffer.offeredTo === playerId);
}

export function isDrawOfferByPlayer(game, playerId) {
  return Boolean(game?.drawOffer?.offeredBy && game.drawOffer.offeredBy === playerId);
}
