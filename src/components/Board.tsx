import { useRef, useState, type PointerEvent } from 'react';

import {
  isBalanced,
  isPlaced,
  sizeOf,
  tilt,
  type Level,
  type Round,
  type Side,
  type Thing,
} from '../lib/game';

// The scale is drawn in these units, and fits the space it gets.
const W = 340;
const H = 268;
const PIVOT = { x: 170, y: 76 };
const ARM = 112; // From the middle to where a pan hangs.
const DROP = 104; // From where a pan hangs down to its rim.
const RIM = 58; // Half the pan's width.
const UNIT = 24; // How big a strawberry is drawn; the rest grow from it.
const SPAN = 116; // How wide a row of fruit on a pan can be.

const drawn = (weight: number) => UNIT * sizeOf(weight);

// How heavy a thing is, shown small on it: nothing on Very easy, where all
// are strawberries; dots on Easy; the number from Medium up.
function Badge({ level, weight }: { level: Level; weight: number }) {
  if (level === 'veryEasy') return null;
  if (level === 'easy') {
    const w = weight * 5 + 3;
    return (
      <g className='badge'>
        <rect x={-w / 2} y={-3.5} width={w} height={7} rx={3.5} />
        {Array.from({ length: weight }, (_, i) => (
          <circle
            key={i}
            className='badge__dot'
            cx={(i - (weight - 1) / 2) * 5}
            r={1.6}
          />
        ))}
      </g>
    );
  }
  const big = weight >= 10;
  return (
    <g className='badge'>
      <circle r={big ? 8 : 6.5} />
      <text className='badge__text' style={{ fontSize: big ? 9 : 8 }}>
        {weight}
      </text>
    </g>
  );
}

type OnPan = { thing: Thing; id?: number };

// Where each thing lies on a pan. The heaviest go in first, and each one
// drops into the lowest spot it fits: on the dish, or resting on what is
// already there, so nothing floats. Things sink a little into each other,
// as fruit does in a bowl.
function heap(things: OnPan[]) {
  const sorted = [...things].sort((a, b) => b.thing.weight - a.thing.weight);
  const placed: (OnPan & { x: number; y: number; size: number })[] = [];
  const tops: { left: number; right: number; top: number }[] = [];
  const DISH_TOP = 3;
  const rest = (o: OnPan, x: number, bottom: number) => {
    const size = drawn(o.thing.weight);
    placed.push({ ...o, x, y: bottom - size / 2, size });
    tops.push({
      left: x - size / 2,
      right: x + size / 2,
      top: bottom - size * 0.78,
    });
  };
  // As many as fit go side by side on the dish, in the middle.
  let width = 0;
  let n = 0;
  while (n < sorted.length && width + drawn(sorted[n].thing.weight) <= SPAN)
    width += drawn(sorted[n++].thing.weight);
  let left = -width / 2;
  for (const o of sorted.slice(0, n)) {
    const size = drawn(o.thing.weight);
    rest(o, left + size / 2, DISH_TOP);
    left += size;
  }
  for (const o of sorted.slice(n)) {
    const size = drawn(o.thing.weight);
    const half = size / 2;
    const reach = Math.max(0, SPAN / 2 - half);
    // Where it would rest at x: on the highest thing under its middle part.
    const restAt = (x: number) =>
      tops
        .filter((t) => t.right > x - half * 0.6 && t.left < x + half * 0.6)
        .reduce((y, t) => Math.min(y, t.top), DISH_TOP);
    let best = { x: 0, bottom: -Infinity };
    for (let x = -reach; x <= reach + 0.01; x += 2) {
      const bottom = restAt(x);
      // Lowest first; then nearest the middle.
      if (
        bottom > best.bottom + 0.5 ||
        (Math.abs(bottom - best.bottom) <= 0.5 &&
          Math.abs(x) < Math.abs(best.x))
      )
        best = { x, bottom };
    }
    rest(o, best.x, best.bottom);
  }
  return placed;
}

type Drag = {
  id: number;
  from: 'shelf' | Side;
  x: number;
  y: number;
  moved: boolean;
};

export function Board({
  round,
  onPlace,
  onMove,
  onTakeOff,
}: {
  round: Round;
  onPlace: (id: number, side: Side) => void;
  onMove: (id: number, side: Side) => void;
  onTakeOff: (id: number) => void;
}) {
  const angle = tilt(round);
  const solved = isBalanced(round);
  const lift = ARM * Math.sin((angle * Math.PI) / 180);

  // Fruit is dragged: from the shelf to a pan, from one pan to the other, or
  // off the scale back to the shelf.
  const drag = useRef<Drag>(undefined);
  const [ghost, setGhost] = useState<{ id: number; x: number; y: number }>();

  const down = (e: PointerEvent<Element>, id: number, from: Drag['from']) => {
    if (solved || e.button > 0) return;
    if (from === 'shelf' && isPlaced(round, id)) return;
    drag.current = { id, from, x: e.clientX, y: e.clientY, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // No capture (a pointer that is already gone); a tap still works.
    }
  };
  const moveTo = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
    d.moved = true;
    setGhost({ id: d.id, x: e.clientX, y: e.clientY });
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = undefined;
    setGhost(undefined);
    if (!d) return;
    // Only a drag moves fruit; a tap does nothing.
    if (!d.moved) return;
    const side = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map((el) => el.closest('[data-side]')?.getAttribute('data-side'))
      .find(Boolean) as Side | undefined;
    if (d.from === 'shelf') {
      if (side) onPlace(d.id, side);
    } else if (!side) onTakeOff(d.id);
    else if (side !== d.from) onMove(d.id, side);
  };
  const cancel = () => {
    drag.current = undefined;
    setGhost(undefined);
  };
  const handlers = {
    onPointerMove: moveTo,
    onPointerUp: up,
    onPointerCancel: cancel,
  };

  const pan = (side: Side) => {
    const x = side === 'left' ? PIVOT.x - ARM : PIVOT.x + ARM;
    const dy = side === 'left' ? -lift : lift;
    const things: OnPan[] = [
      ...(side === 'left' ? round.given.map((thing) => ({ thing })) : []),
      ...round.placed
        .filter((p) => p.side === side)
        .map((p) => ({ thing: round.shelf[p.id], id: p.id })),
    ];
    return (
      <g
        className='pan'
        data-side={side}
        style={{ transform: `translate(${x}px, ${PIVOT.y + dy}px)` }}
      >
        {/* A big, see-through spot to drop fruit on. */}
        <rect
          className='pan__target'
          x={-RIM - 6}
          y={-10}
          width={RIM * 2 + 12}
          height={DROP + 40}
        />
        <path
          className='pan__chain'
          d={`M0 0 ${-RIM + 4} ${DROP}M0 0 ${RIM - 4} ${DROP}`}
        />
        <circle className='pan__ring' r={4} />
        <ellipse className='pan__back' cy={DROP} rx={RIM} ry={7} />
        <g transform={`translate(0 ${DROP})`}>
          {heap(things).map((o, i) => (
            <g
              key={o.id ?? `given-${i}`}
              className={
                o.id === undefined
                  ? 'thing'
                  : ghost?.id === o.id
                    ? 'thing thing--lifted'
                    : 'thing thing--loose'
              }
              transform={`translate(${o.x} ${o.y})`}
              {...(o.id !== undefined && {
                onPointerDown: (e: PointerEvent<SVGGElement>) =>
                  down(e, o.id!, side),
                ...handlers,
              })}
            >
              <circle className='thing__hit' r={Math.max(o.size / 2, 14)} />
              <text className='thing__look' style={{ fontSize: o.size }}>
                {o.thing.look}
              </text>
              <g transform={`translate(${o.size * 0.36} ${o.size * 0.3})`}>
                <Badge level={round.level} weight={o.thing.weight} />
              </g>
            </g>
          ))}
        </g>
        <path
          className='pan__bowl'
          d={`M${-RIM} ${DROP}a${RIM} 24 0 0 0 ${RIM * 2} 0a${RIM} 7 0 0 1 ${-RIM * 2} 0z`}
        />
      </g>
    );
  };

  const P = PIVOT;

  return (
    <div className={solved ? 'board board--solved' : 'board'}>
      <svg className='scale' viewBox={`0 0 ${W} ${H}`} aria-hidden='true'>
        <defs>
          <linearGradient id='brass' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0' className='brass--light' />
            <stop offset='1' className='brass--dark' />
          </linearGradient>
          <linearGradient id='column' x1='0' y1='0' x2='1' y2='0'>
            <stop offset='0' className='brass--dark' />
            <stop offset='0.45' className='brass--light' />
            <stop offset='1' className='brass--dark' />
          </linearGradient>
        </defs>

        {/* The stand */}
        <rect
          className='stand'
          x={P.x - 62}
          y={H - 16}
          width={124}
          height={14}
          rx={7}
        />
        <rect
          className='stand'
          x={P.x - 34}
          y={H - 26}
          width={68}
          height={12}
          rx={6}
        />
        <path
          className='stand stand--column'
          d={`M${P.x - 9} ${H - 26}L${P.x - 4} ${P.y}h8L${P.x + 9} ${H - 26}z`}
        />

        {/* The dial: the needle stands on the green mark when level. */}
        <path
          className='dial'
          d={`M${P.x - 26} ${P.y - 38}A46 46 0 0 1 ${P.x + 26} ${P.y - 38}`}
        />
        <path className='dial__level' d={`M${P.x} ${P.y - 41}v-8`} />

        <g
          className='beam'
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${P.x}px ${P.y}px`,
          }}
        >
          <path
            className='needle'
            d={`M${P.x - 3} ${P.y}L${P.x} ${P.y - 44}L${P.x + 3} ${P.y}z`}
          />
          <path
            className='beam__bar'
            d={`M${P.x - ARM} ${P.y - 3}Q${P.x} ${P.y - 9} ${P.x + ARM} ${P.y - 3}v6Q${P.x} ${P.y + 9} ${P.x - ARM} ${P.y + 3}z`}
          />
          <circle className='beam__end' cx={P.x - ARM} cy={P.y} r={5} />
          <circle className='beam__end' cx={P.x + ARM} cy={P.y} r={5} />
        </g>
        <circle className='pivot' cx={P.x} cy={P.y} r={10} />
        <circle className='pivot__pin' cx={P.x} cy={P.y} r={3.5} />

        {pan('left')}
        {pan('right')}
      </svg>

      {/* Once level, the card for the next round takes its place. */}
      {!solved && (
        <div className='shelf'>
          {round.shelf.map((thing, id) => (
            <button
              key={id}
              className={isPlaced(round, id) ? 'fruit fruit--placed' : 'fruit'}
              onPointerDown={(e) => down(e, id, 'shelf')}
              {...handlers}
              onKeyDown={(e) => {
                // Keyboards have no drag: Enter or Space puts it on or off.
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                if (isPlaced(round, id)) onTakeOff(id);
                else onPlace(id, 'right');
              }}
              aria-label={`${thing.look} ${thing.weight}`}
            >
              <span
                className='fruit__look'
                style={{ fontSize: 13 * sizeOf(thing.weight) + 8 }}
              >
                {thing.look}
              </span>
              {round.level !== 'veryEasy' && (
                <span className='fruit__weight'>
                  {round.level === 'easy'
                    ? '•'.repeat(thing.weight)
                    : thing.weight}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {ghost && (
        <div
          className='ghost'
          style={{
            left: ghost.x,
            top: ghost.y,
            fontSize: 22 * sizeOf(round.shelf[ghost.id].weight) + 10,
          }}
          aria-hidden='true'
        >
          {round.shelf[ghost.id].look}
        </div>
      )}
    </div>
  );
}
