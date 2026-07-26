import { useState } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';

export function ReviewPgnPanel({ pgn }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pgn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PGN', err);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-50">PGN</h2>
        <Button variant="ghost" className="h-8 px-2 py-1 text-xs" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy PGN'}
        </Button>
      </div>
      <div className="max-h-48 overflow-auto rounded-md border border-slate-800 bg-slate-950 p-3">
        <p className="whitespace-pre-wrap break-words font-mono text-xs text-slate-300">
          {pgn || 'No PGN available'}
        </p>
      </div>
    </Card>
  );
}
