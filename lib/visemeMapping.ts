import type { Viseme } from './types';

export function charToViseme(char: string): Viseme {
  if (!char) return 'rest';
  const c = char.toLowerCase();
  if ('mbp'.includes(c)) return 'closed';
  if ('a'.includes(c)) return 'open-a';
  if ('ei'.includes(c)) return 'open-e';
  if ('o'.includes(c)) return 'open-o';
  if ('uw'.includes(c)) return 'open-u';
  return 'rest';
}
