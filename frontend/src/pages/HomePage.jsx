import { Link } from 'react-router-dom';
import { PageContainer } from '@components/common/PageContainer';
import { Section } from '@components/common/Section';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';

export function HomePage() {
  return (
    <PageContainer>
      <section className="grid min-h-[60vh] items-center gap-10 py-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            Real-time chess arena
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-slate-50 sm:text-5xl">
            Create a room, invite a player, and prepare for a live match.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Chess Arena is building toward a server-authoritative multiplayer chess experience. This
            milestone focuses on the lobby flow: choose a display name, create a game, or join an
            existing room.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to="/lobby">
              Create Game
            </Button>
            <Button as={Link} to="/lobby" variant="secondary">
              Join Game
            </Button>
          </div>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-slate-50">Lobby-ready foundation</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The frontend now has reusable components, persistent player naming, API service
            boundaries, and a placeholder game route ready for future gameplay.
          </p>
        </Card>
      </section>

      <Section title="What is available now">
        <div className="grid gap-4 md:grid-cols-3">
          {['Display name setup', 'Create game flow', 'Join game flow'].map((item) => (
            <Card key={item}>
              <h2 className="text-base font-semibold text-slate-50">{item}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Built as a reusable foundation for the next frontend milestones.
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </PageContainer>
  );
}
