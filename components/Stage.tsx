'use client';

import type { Asset } from '@/lib/types';

interface Props {
  asset: Asset | null;
}

export default function Stage({ asset }: Props) {
  if (asset === null) return null;
  if (asset.type === 'video') {
    return (
      <video
        src={asset.url}
        muted
        autoPlay
        loop
        className="h-full w-full object-contain"
      />
    );
  }
  return (
    <img
      src={asset.url}
      alt={asset.alt_text ?? ''}
      className="h-full w-full object-contain"
    />
  );
}
