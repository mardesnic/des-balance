import { describe, expect, it } from 'vitest';

import { LEVELS, initialStats, newRound } from './game';

describe('game', () => {
  it('starts a round at the chosen level', () => {
    expect(newRound('easy')).toEqual({ level: 'easy' });
  });

  it('counts nothing solved at first', () => {
    for (const l of LEVELS) expect(initialStats[l].solved).toBe(0);
  });
});
