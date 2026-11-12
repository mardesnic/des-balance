import { describe, expect, it } from 'vitest';

import {
  FRUIT,
  LEVELS,
  canUseLeft,
  givenWeight,
  initialStats,
  isBalanced,
  isSolvable,
  lastOn,
  newRound,
  place,
  recordWin,
  solutions,
  startOver,
  takeOff,
  tilt,
  undo,
  weights,
  type Round,
} from './game';

// A repeatable random, so a failing round can be seen again.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

const round = (given: number[], shelf: number[], level = 'medium'): Round => ({
  level: level as Round['level'],
  given: given.map((weight) => ({ weight, look: '🎃' })),
  shelf: shelf.map((weight) => ({ weight, look: FRUIT[weight] })),
  placed: [],
  history: [],
});

describe('new rounds', () => {
  for (const level of LEVELS) {
    it(`are always solvable on ${level}`, () => {
      const random = seeded(LEVELS.indexOf(level) + 1);
      for (let i = 0; i < 300; i++) {
        const r = newRound(level, random);
        expect(isSolvable(r)).toBe(true);
        expect(r.placed).toEqual([]);
        for (const t of r.shelf) expect(FRUIT[t.weight]).toBe(t.look);
      }
    });
  }

  it('use only strawberries on Very easy, up to five', () => {
    const random = seeded(7);
    for (let i = 0; i < 100; i++) {
      const r = newRound('veryEasy', random);
      expect(r.given.every((t) => t.weight === 1)).toBe(true);
      expect(r.given.length).toBeLessThanOrEqual(5);
      expect(r.shelf.every((t) => t.weight === 1)).toBe(true);
    }
  });

  it('always have an apple on the left on Easy', () => {
    const random = seeded(8);
    for (let i = 0; i < 100; i++)
      expect(newRound('easy', random).given.some((t) => t.weight === 2)).toBe(
        true
      );
  });

  it('never have one fruit as the whole answer from Easy up', () => {
    const random = seeded(9);
    for (const level of LEVELS.slice(1))
      for (let i = 0; i < 100; i++) {
        const r = newRound(level, random);
        expect(r.shelf.map((t) => t.weight)).not.toContain(givenWeight(r));
      }
  });

  it('often need fruit on the left on Hard, never before', () => {
    const random = seeded(10);
    let needLeft = 0;
    for (let i = 0; i < 200; i++) {
      const r = newRound('hard', random);
      if (!solutions(r).plain) needLeft++;
    }
    expect(needLeft).toBeGreaterThan(80);
    expect(needLeft).toBeLessThan(180);
    for (const level of LEVELS.slice(0, 3))
      for (let i = 0; i < 50; i++)
        expect(solutions(newRound(level, random)).plain).toBe(true);
  });

  it('do not give the same weight twice in a row', () => {
    const random = seeded(11);
    for (let i = 0; i < 100; i++)
      expect(givenWeight(newRound('veryEasy', random, 3))).not.toBe(3);
  });
});

describe('playing', () => {
  it('weighs both pans', () => {
    let r = round([7], [2, 5, 10], 'hard');
    expect(weights(r)).toEqual({ left: 7, right: 0 });
    r = place(r, 2, 'right');
    r = place(r, 0, 'left');
    expect(weights(r)).toEqual({ left: 9, right: 10 });
    expect(isBalanced(r)).toBe(false);
  });

  it('is balanced when both pans weigh the same', () => {
    let r = round([7], [2, 5, 3]);
    r = place(place(r, 0, 'right'), 1, 'right');
    expect(isBalanced(r)).toBe(true);
  });

  it('puts fruit on the left only on Hard', () => {
    expect(LEVELS.filter(canUseLeft)).toEqual(['hard']);
    const r = place(round([4], [1, 3]), 0, 'left');
    expect(r.placed).toEqual([{ id: 0, side: 'right' }]);
  });

  it('puts each fruit on once, and nothing after a win', () => {
    let r = place(round([2], [2, 1]), 1, 'right');
    expect(place(r, 1, 'right')).toBe(r);
    r = place(r, 0, 'right');
    r = takeOff(r, 1);
    expect(isBalanced(r)).toBe(true);
    expect(place(r, 1, 'right')).toBe(r);
    expect(takeOff(r, 0)).toBe(r);
  });

  it('takes fruit off, the last on a pan first', () => {
    let r = round([5], [1, 2, 3]);
    r = place(place(r, 0, 'right'), 2, 'right');
    expect(lastOn(r, 'right')).toBe(2);
    expect(lastOn(r, 'left')).toBeUndefined();
    r = takeOff(r, 2);
    expect(r.placed).toEqual([{ id: 0, side: 'right' }]);
  });

  it('undoes moves one at a time, and starting over too', () => {
    let r = round([5], [1, 2, 3]);
    r = place(place(r, 0, 'right'), 1, 'right');
    r = startOver(r);
    expect(r.placed).toEqual([]);
    expect(startOver(r)).toBe(r);
    r = undo(r);
    expect(r.placed.length).toBe(2);
    r = undo(undo(r));
    expect(r.placed).toEqual([]);
    expect(undo(r)).toBe(r);
  });

  it('leans to the heavier side, even by one', () => {
    let r = round([1], [1, 1], 'veryEasy');
    expect(tilt(r)).toBeLessThan(0);
    r = place(r, 0, 'right');
    expect(tilt(r)).toBe(0);
    r = place(round([1], [2]), 0, 'right');
    expect(tilt(r)).toBeGreaterThan(5);
    expect(tilt(round([30], [1]))).toBeGreaterThanOrEqual(-16);
  });

  it('counts a win', () => {
    let r = round([2], [2, 1]);
    expect(recordWin(initialStats, r)).toBe(initialStats);
    r = place(r, 0, 'right');
    expect(recordWin(initialStats, r).medium.solved).toBe(1);
  });
});
