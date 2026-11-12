// The game's rules come later; for now a round is only its level.
export const LEVELS = ['veryEasy', 'easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

export type Round = { level: Level };

export type Store = { round?: Round };

export const initialStore: Store = {};

export const newRound = (level: Level): Round => ({ level });

export type Stats = { [L in Level]: { solved: number } };

export const initialStats = Object.fromEntries(
  LEVELS.map((l) => [l, { solved: 0 }])
) as Stats;
