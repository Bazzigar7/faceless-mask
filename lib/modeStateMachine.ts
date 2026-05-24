import type { Asset } from '@/lib/types';

export type Mode = 'solo' | 'visual';

export function getMode(asset: Asset | null): Mode {
  return asset === null ? 'solo' : 'visual';
}
