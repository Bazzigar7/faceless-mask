'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Mask from './Mask';
import Stage from './Stage';
import type { Asset, Viseme } from '@/lib/types';
import type { Mode } from '@/lib/modeStateMachine';

interface Props {
  viseme: Viseme;
  matchedAsset: Asset | null;
  mode: Mode;
  paused?: boolean;
  onEnded?: () => void;
}

export default function StageLayout({ viseme, matchedAsset, mode, paused, onEnded }: Props) {
  return (
    <>
      <motion.div
        className="absolute z-10"
        style={{
          top: '50%',
          left: '50%',
          width: '60vh',
          height: '60vh',
          marginLeft: '-30vh',
          marginTop: '-30vh',
        }}
        initial={false}
        animate={
          mode === 'visual'
            ? { x: '35vw', y: '-35vh', scale: 0.42 }
            : { x: 0, y: 0, scale: 1 }
        }
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <Mask viseme={viseme} className="h-full w-full" />
      </motion.div>
      <AnimatePresence>
        {matchedAsset && (
          <motion.div
            key={matchedAsset.id}
            className="absolute z-10"
            style={{
              top: '50%',
              left: '5vw',
              width: '50vw',
              height: '60vh',
              marginTop: '-30vh',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Stage asset={matchedAsset} paused={paused} onEnded={onEnded} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
