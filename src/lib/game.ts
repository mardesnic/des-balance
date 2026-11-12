// A balance scale. Things on the left pan are given; the child puts fruit
// from the shelf on the scale until both pans weigh the same.

export const LEVELS = ['veryEasy', 'easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

export type Side = 'left' | 'right';

// Something on the scale: how heavy it is, and what it looks like.
export type Thing = { weight: number; look: string };

// Each fruit always weighs the same, so a child can learn them.
export const FRUIT: Record<number, string> = {
  1: '🍓',
  2: '🍎',
  3: '🍐',
  5: '🍍',
  10: '🍉',
};

// One vegetable on the left, from Medium up, with its weight written on it.
// A heavier one is a bigger vegetable, so it looks about right next to the
// fruit: a potato is light, a pumpkin heavy.
const VEGETABLES: [number, string[]][] = [
  [6, ['🥕', '🥔', '🌽']],
  [11, ['🍆', '🥦', '🥒']],
  [Infinity, ['🎃', '🥬']],
];

// How big something is drawn: its size grows with its weight like a real
// fruit's does (by volume), so a watermelon is about twice a strawberry
// across, not ten times.
export const sizeOf = (weight: number) => Math.cbrt(weight);

const fruit = (weight: number): Thing => ({ weight, look: FRUIT[weight] });

export type Placed = { id: number; side: Side };

export type Round = {
  level: Level;
  // Fixed on the left pan.
  given: Thing[];
  // The fruit on the shelf, by its place there (its id).
  shelf: Thing[];
  // Fruit taken from the shelf onto the scale, in the order put there.
  placed: Placed[];
  // Earlier `placed`, for Undo.
  history: Placed[][];
};

// Only on Hard may fruit also go on the left, next to the vegetable.
export const canUseLeft = (level: Level) => level === 'hard';

const sum = (things: Thing[]) => things.reduce((s, t) => s + t.weight, 0);

export function weights(round: Round) {
  const on = (side: Side) =>
    sum(
      round.placed.filter((p) => p.side === side).map((p) => round.shelf[p.id])
    );
  return { left: sum(round.given) + on('left'), right: on('right') };
}

export function isBalanced(round: Round) {
  const { left, right } = weights(round);
  return round.placed.length > 0 && left === right;
}

// How far the beam leans, in degrees: positive when the right is heavier.
// Even one strawberry of difference shows clearly.
export function tilt(round: Round) {
  const { left, right } = weights(round);
  const d = right - left;
  if (d === 0) return 0;
  return Math.sign(d) * Math.min(16, 6 + Math.abs(d) * 1.5);
}

export const isPlaced = (round: Round, id: number) =>
  round.placed.some((p) => p.id === id);

const change = (round: Round, placed: Placed[]): Round => ({
  ...round,
  placed,
  history: [...round.history, round.placed],
});

export function place(round: Round, id: number, side: Side): Round {
  if (isPlaced(round, id) || !round.shelf[id] || isBalanced(round))
    return round;
  if (side === 'left' && !canUseLeft(round.level)) side = 'right';
  return change(round, [...round.placed, { id, side }]);
}

// Moves fruit already on the scale to the other pan.
export function move(round: Round, id: number, side: Side): Round {
  const at = round.placed.find((p) => p.id === id);
  if (!at || at.side === side || isBalanced(round)) return round;
  if (side === 'left' && !canUseLeft(round.level)) return round;
  return change(
    round,
    round.placed.map((p) => (p.id === id ? { id, side } : p))
  );
}

export function takeOff(round: Round, id: number): Round {
  if (!isPlaced(round, id) || isBalanced(round)) return round;
  return change(
    round,
    round.placed.filter((p) => p.id !== id)
  );
}

// The fruit put on that pan last, to take off when the pan is tapped.
export function lastOn(round: Round, side: Side) {
  return round.placed.findLast((p) => p.side === side)?.id;
}

export function undo(round: Round): Round {
  if (!round.history.length) return round;
  return {
    ...round,
    placed: round.history[round.history.length - 1],
    history: round.history.slice(0, -1),
  };
}

export function startOver(round: Round): Round {
  return round.placed.length ? change(round, []) : round;
}

// Every way to put some of the shelf on the left and some on the right, as
// [left, right] weights added. Shelves are small, so trying them all is quick.
function* splits(shelf: Thing[]): Generator<[number, number]> {
  const n = shelf.length;
  for (let code = 0; code < 3 ** n; code++) {
    let left = 0;
    let right = 0;
    let c = code;
    for (let i = 0; i < n; i++) {
      const where = c % 3;
      c = Math.floor(c / 3);
      if (where === 1) right += shelf[i].weight;
      if (where === 2) left += shelf[i].weight;
    }
    yield [left, right];
  }
}

// Whether the round can be solved, and whether it needs fruit on the left.
export function solutions(round: Pick<Round, 'given' | 'shelf'>) {
  const target = sum(round.given);
  let plain = false;
  let withLeft = false;
  for (const [left, right] of splits(round.shelf)) {
    if (right === 0 || target + left !== right) continue;
    if (left === 0) plain = true;
    else withLeft = true;
  }
  return { plain, withLeft };
}

export function isSolvable(round: Round) {
  const { plain, withLeft } = solutions(round);
  return plain || (canUseLeft(round.level) && withLeft);
}

const between = (lo: number, hi: number, random: () => number) =>
  lo + Math.floor(random() * (hi - lo + 1));

const pick = <T>(list: readonly T[], random: () => number) =>
  list[Math.floor(random() * list.length)];

function vegetable(weight: number, random: () => number): Thing {
  const looks = VEGETABLES.find(([upTo]) => weight <= upTo)![1];
  return { weight, look: pick(looks, random) };
}

function make(level: Level, random: () => number): Omit<Round, 'level'> {
  const empty = { placed: [], history: [] };
  switch (level) {
    // Strawberries only: put as many as there are on the left.
    case 'veryEasy': {
      const n = between(1, 5, random);
      return {
        ...empty,
        given: Array.from({ length: n }, () => fruit(1)),
        shelf: Array.from({ length: 6 }, () => fruit(1)),
      };
    }
    // Strawberries and apples, and an apple weighs two strawberries.
    case 'easy': {
      const given: Thing[] = [fruit(2)];
      const count = between(2, 3, random);
      while (given.length < count) given.push(fruit(random() < 0.5 ? 1 : 2));
      given.sort((a, b) => a.weight - b.weight);
      return {
        ...empty,
        given,
        shelf: [...Array(5).fill(1), ...Array(4).fill(2)].map(fruit),
      };
    }
    // A vegetable, and a few fruit to pick the right ones from.
    case 'medium': {
      const shelf = Array.from({ length: 5 }, () =>
        fruit(pick([1, 2, 3, 5], random))
      ).sort((a, b) => a.weight - b.weight);
      return {
        ...empty,
        given: [vegetable(between(4, 12, random), random)],
        shelf,
      };
    }
    // Heavier vegetables, and often some fruit must go next to them.
    case 'hard': {
      const shelf = Array.from({ length: 4 }, () =>
        fruit(pick([1, 2, 3, 5, 10], random))
      ).sort((a, b) => a.weight - b.weight);
      return {
        ...empty,
        given: [vegetable(between(6, 20, random), random)],
        shelf,
      };
    }
  }
}

// A good round for the level: solvable, and not solved by one fruit alone
// (except on Very easy, where one strawberry can be the whole answer). On
// Hard, most rounds need fruit on the left. `last` is the weight to avoid
// giving twice in a row.
export function newRound(
  level: Level,
  random = Math.random,
  last?: number
): Round {
  const needLeft = level === 'hard' && random() < 0.6;
  for (;;) {
    const round: Round = { level, ...make(level, random) };
    const target = sum(round.given);
    if (target === last) continue;
    const { plain, withLeft } = solutions(round);
    if (needLeft ? plain || !withLeft : !plain) continue;
    if (level !== 'veryEasy' && round.shelf.some((t) => t.weight === target))
      continue;
    return round;
  }
}

export const givenWeight = (round: Round) => sum(round.given);

export type Store = { round?: Round };

export const initialStore: Store = {};

export type Stats = { [L in Level]: { solved: number } };

export const initialStats = Object.fromEntries(
  LEVELS.map((l) => [l, { solved: 0 }])
) as Stats;

export const recordWin = (stats: Stats, round: Round): Stats =>
  isBalanced(round)
    ? { ...stats, [round.level]: { solved: stats[round.level].solved + 1 } }
    : stats;
