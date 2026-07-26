import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { ConnectionStatus } from '@components/common/ConnectionStatus';
import { TimerDisplay } from './TimerDisplay';

// PlayerPanel renders backend player identity and runtime connection state.
export function PlayerPanel({ 
  isCurrentTurn = false, 
  player,
  remainingMs = 600000,
  timerStartedAt = null,
  gameId
}) {
  const displayName = player?.displayName ?? 'Waiting for player';
  const color = player?.color ?? 'Player';
  const isConnected = player?.connected ?? false;
  const connectionTone = isConnected ? 'success' : 'warning';
  const connectionLabel = isConnected ? 'Connected' : 'Disconnected';

  return (
    <section
      aria-label={`${color} player`}
      className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/20 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar label={displayName} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-slate-50">{displayName}</h2>
            <Badge>{color}</Badge>
            {isCurrentTurn ? <Badge tone="success">To move</Badge> : null}
          </div>
          <div className="mt-2">
            <ConnectionStatus label={connectionLabel} tone={connectionTone} />
          </div>
        </div>
      </div>
      <TimerDisplay 
        gameId={gameId}
        isActiveTurn={isCurrentTurn} 
        remainingMs={remainingMs} 
        timerStartedAt={timerStartedAt} 
      />
    </section>
  );
}
