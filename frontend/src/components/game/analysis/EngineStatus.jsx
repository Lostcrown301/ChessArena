import { Badge } from '@components/ui/Badge';

export function EngineStatus({ error, isThinking }) {
  if (isThinking) {
    return <Badge tone="warning">Engine thinking</Badge>;
  }

  if (error) {
    return <Badge tone="warning">Engine unavailable</Badge>;
  }

  return <Badge tone="success">Ready</Badge>;
}
