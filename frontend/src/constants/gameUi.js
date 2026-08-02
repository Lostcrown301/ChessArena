export const GAME_STATUSES = [
  { id: 'WAITING', label: 'Waiting', tone: 'warning' },
  { id: 'ACTIVE', label: 'Active', tone: 'success' },
  { id: 'CHECK', label: 'Check', tone: 'warning' },
  { id: 'CHECKMATE', label: 'Checkmate', tone: 'warning' },
  { id: 'DRAW', label: 'Draw', tone: 'neutral' },
  { id: 'RESIGNED', label: 'Resigned', tone: 'warning' },
  { id: 'ABANDONED', label: 'Disconnected', tone: 'warning' },
  { id: 'COMPLETED', label: 'Completed', tone: 'neutral' },
  { id: 'TIMEOUT', label: 'Timeout', tone: 'warning' },
  { id: 'white-to-move', label: 'White to move', tone: 'success' },
  { id: 'black-to-move', label: 'Black to move', tone: 'neutral' },
];

export const ACTIVE_GAME_STATUSES = ['ACTIVE', 'CHECK'];
export const TERMINAL_GAME_STATUSES = [
  'CHECKMATE',
  'DRAW',
  'RESIGNED',
  'ABANDONED',
  'COMPLETED',
  'TIMEOUT',
];
