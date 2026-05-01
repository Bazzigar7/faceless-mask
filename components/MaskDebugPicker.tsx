// DEBUG ONLY, REMOVE BEFORE 2a.1 SHIPS
// Temporary client wrapper that lets Baz flip through all 6 visemes by hand
// to visually verify each shape renders correctly. Removed in commit 2a.1c
// before Substep B's stage layout work begins.

'use client';

import { useState } from 'react';
import Mask, { type Viseme } from './Mask';

const VISEMES: Viseme[] = ['rest', 'closed', 'open-a', 'open-e', 'open-o', 'open-u'];

export default function MaskDebugPicker() {
  const [viseme, setViseme] = useState<Viseme>('rest');
  return (
    <div className="flex flex-col items-center gap-3">
      <Mask viseme={viseme} className="w-80 h-80" />
      <select
        value={viseme}
        onChange={(e) => setViseme(e.target.value as Viseme)}
        className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
      >
        {VISEMES.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <span className="text-[10px] uppercase tracking-wider text-amber-400/80">
        debug only
      </span>
    </div>
  );
}
