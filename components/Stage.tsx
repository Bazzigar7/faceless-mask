'use client';

import { useEffect, useRef } from 'react';
import type { Asset } from '@/lib/types';

interface Props {
  asset: Asset | null;
  paused?: boolean;
  onEnded?: () => void;
}

export default function Stage({ asset, paused, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused]);

  if (asset === null) return null;
  if (asset.type === 'video') {
    return (
      <video
        ref={videoRef}
        src={asset.url}
        autoPlay
        playsInline
        onEnded={onEnded}
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
