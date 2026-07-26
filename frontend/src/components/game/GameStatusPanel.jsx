import { Badge } from '@components/ui/Badge';
import { Card } from '@components/ui/Card';
import { GAME_STATUSES } from '@constants/gameUi';

// GameStatusPanel highlights backend status and backend-reported side to move.
export function GameStatusPanel({ activeStatus = 'WAITING', turn = 'w' }) {
  const turnStatus = turn === 'b' ? 'black-to-move' : 'white-to-move';

  return (
    <Card as="section" data-testid="game-status-panel">
      <h2 className="text-base font-semibold text-slate-50">Game Status</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {GAME_STATUSES.map((status) => (
          <Badge
            className={
              status.id === activeStatus || status.id === turnStatus
                ? 'ring-2 ring-emerald-300/50'
                : 'opacity-70'
            }
            key={status.id}
            tone={status.tone}
          >
            {status.label}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
