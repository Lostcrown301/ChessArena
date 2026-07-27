export function getFriendlyGameError(error) {
  if (error?.code === 'GAME_NOT_FOUND' || error?.status === 404) {
    return 'We could not find a game with that ID.';
  }

  if (error?.code === 'GAME_FULL' || error?.code === 'ROOM_FULL' || error?.status === 409) {
    return 'That game is already full.';
  }

  if (error?.code === 'WRONG_TURN') {
    return 'It is not your turn yet.';
  }

  if (error?.code === 'ILLEGAL_MOVE') {
    return 'That move was rejected by the server.';
  }

  if (error?.code === 'PLAYER_NOT_IN_GAME') {
    return 'This browser is not registered as a player in that game.';
  }

  if (
    error?.code === 'SOCKET_ACK_TIMEOUT' ||
    error?.code === 'SOCKET_CONNECT_TIMEOUT' ||
    error?.code === 'TIMEOUT' ||
    error?.status === 504
  ) {
    return 'The server did not respond in time. Please try again.';
  }

  if (error?.code === 'SOCKET_CONNECT_FAILED') {
    return 'Unable to connect to the game server.';
  }

  if (error?.code === 'INVALID_FEN') {
    return 'Stockfish could not analyze that board position.';
  }

  if (error?.code === 'ENGINE_TIMEOUT') {
    return 'Stockfish took too long to respond. Try again with a lower depth.';
  }

  if (error?.code === 'ENGINE_UNAVAILABLE' || error?.code === 'ENGINE_CRASHED') {
    return 'Stockfish is unavailable right now.';
  }

  if (error?.code === 'GEMINI_TIMEOUT') {
    return 'The AI coach took too long to respond. Please try again.';
  }

  if (error?.code === 'GEMINI_RATE_LIMITED') {
    return 'The AI coach is busy right now. Please retry in a moment.';
  }

  if (
    error?.code === 'GEMINI_UNAVAILABLE' ||
    error?.code === 'GEMINI_RESPONSE_INVALID' ||
    error?.code === 'GEMINI_REQUEST_FAILED'
  ) {
    return 'The AI coach is unavailable right now.';
  }

  if (error?.code === 'INVALID_ANALYSIS') {
    return 'That analysis could not be explained.';
  }

  if (error?.status === 0) {
    return 'Unable to reach Chess Arena right now. Check your connection and try again.';
  }

  return error?.message ?? 'Something went wrong. Please try again.';
}
