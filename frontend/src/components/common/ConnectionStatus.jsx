import { Badge } from '@components/ui/Badge';

// ConnectionStatus is presentational; real socket state will be passed in later.
export function ConnectionStatus({ label = 'Offline', tone = 'neutral' }) {
  return <Badge tone={tone}>{label}</Badge>;
}
