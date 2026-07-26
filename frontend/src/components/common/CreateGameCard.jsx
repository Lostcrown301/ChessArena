import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';

export function CreateGameCard({ disabled, onCreate }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-slate-50">Create Game</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Start a new room and share the generated game ID with another player.
      </p>
      <Button className="mt-6 w-full" disabled={disabled} onClick={onCreate}>
        Create game
      </Button>
    </Card>
  );
}
