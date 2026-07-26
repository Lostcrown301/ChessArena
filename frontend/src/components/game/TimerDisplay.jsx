import { useEffect, useState } from 'react';
import { classNames } from '@utils/classNames';
import { getSocket } from '@services/socket/gameSocketService';
import { SOCKET_EVENTS } from '@constants/socketEvents';

function formatTime(ms) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimerDisplay({ 
  className, 
  gameId,
  isActiveTurn = false, 
  label = 'Timer', 
  remainingMs = 600000, 
  timerStartedAt = null 
}) {
  const [displayMs, setDisplayMs] = useState(remainingMs);
  const [localReceiptTime, setLocalReceiptTime] = useState(Date.now());

  useEffect(() => {
    setDisplayMs(remainingMs);
    setLocalReceiptTime(Date.now());
  }, [remainingMs, timerStartedAt]);

  useEffect(() => {
    if (!isActiveTurn || !timerStartedAt) {
      return;
    }

    let frameId;
    let hasClaimedTimeout = false;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - localReceiptTime;
      const nextDisplayMs = remainingMs - elapsed;

      if (nextDisplayMs <= 0) {
        setDisplayMs(0);
        if (!hasClaimedTimeout && gameId) {
          hasClaimedTimeout = true;
          const socket = getSocket();
          socket.emit(SOCKET_EVENTS.CLAIM_TIMEOUT, { gameId });
        }
        return;
      }

      setDisplayMs(nextDisplayMs);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isActiveTurn, remainingMs, timerStartedAt, localReceiptTime, gameId]);

  return (
    <span
      aria-label={`${label}: ${formatTime(displayMs)}`}
      className={classNames(
        'inline-flex min-w-20 items-center justify-center rounded-md border px-3 py-2 font-mono text-xl font-bold tracking-tight',
        isActiveTurn 
          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
          : 'border-slate-700 bg-slate-950 text-slate-400',
        className,
      )}
    >
      {formatTime(displayMs)}
    </span>
  );
}
