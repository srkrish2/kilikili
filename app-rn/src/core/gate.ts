// The grown-ups gate: a short arithmetic word problem (App Store Kids category).
// Numbers are chosen so a preschooler can't guess and an adult can do it in their head.
import type { Rng } from './types';

export interface GateProblem { question: string; answer: number }

const pick = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

export function gateProblem(rng: Rng): GateProblem {
  const a = pick(rng, 6, 9);
  const b = pick(rng, 5, 9);
  const templates: ((a: number, b: number) => GateProblem)[] = [
    (a, b) => ({ question: `Koo pulls ${a} wagons. ${b} more wagons join. How many wagons now?`, answer: a + b }),
    (a, b) => ({ question: `Anil has ${a + b} nuts and eats ${b}. How many are left?`, answer: a }),
    (a, b) => ({ question: `Nandu finds ${a} shells, then ${b} more. How many shells?`, answer: a + b }),
  ];
  return templates[Math.floor(rng() * templates.length)](a, b);
}
