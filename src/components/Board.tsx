import { useRef, useState, type PointerEvent } from 'react';

import {
  FRUIT,
  isBalanced,
  isPlaced,
  tilt,
  type Level,
  type Round,
  type Side,
  type Thing,
} from '../lib/game';

// The scale is drawn in these units, and fits the space it gets.
const PIVOT = { x: 170, y: 58 };
const ARM = 112; // From the middle to where a pan hangs.
const DISH = 112; // From where a pan hangs down to its dish.
const SIZE = 27; // A fruit on a pan.
const PER_ROW = 4;

// How heavy a fruit is, shown small on it: nothing on Very easy, where all
// are strawberries; dots on Easy; the number from Medium up.
function badge(level: Level, weight: number, big = false) {
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
  const r = big ? 10 : 6.5;
  return (
    <g className='badge'>
      <circle r={r} />
      <text className='badge__text' style={{ fontSize: big ? 12 : 8 }}>
        {weight}
      </text>
    </g>
  );
}

function Fruit({
  thing,
  level,
  x,
  y,
  size = SIZE,
}: {
  thing: Thing;
  level: Level;
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <g className='thing' transform={`translate(${x} ${y})`}>
      <text className='thing__look' style={{ fontSize: size }}>
        {thing.look}
      </text>
      <g transform={`translate(${size * 0.38} ${size * 0.3})`}>
        {badge(level, thing.weight, size > SIZE)}
      </g>
    </g>
  );
}

// What lies on one pan, in rows from the dish up. A vegetable sits in the
// middle with any fruit on top.
function Load({ things, level }: { things: Thing[]; level: Level }) {
  const big = things[0] && !FRUITS.includes(things[0].look);
  const fruit = big ? things.slice(1) : things;
  const base = DISH - SIZE / 2 - 2 - (big ? 52 : 0);
  return (
    <>
      {big && (
        <Fruit thing={things[0]} level={level} x={0} y={DISH - 30} size={58} />
      )}
      {fruit.map((t, i) => {
        const row = Math.floor(i / PER_ROW);
        const inRow = Math.min(PER_ROW, fruit.length - row * PER_ROW);
        const col = i % PER_ROW;
        return (
          <Fruit
            key={i}
            thing={t}
            level={level}
            x={(col - (inRow - 1) / 2) * (SIZE + 1)}
            y={base - row * (SIZE - 2)}
          />
        );
      })}
    </>
  );
}

// A vegetable is drawn big; fruit is not.
const FRUITS = Object.values(FRUIT);

export function Board({
  round,
  onPlace,
  onTakeOff,
  onTapPan,
}: {
  round: Round;
  onPlace: (id: number, side: Side) => void;
  onTakeOff: (id: number) => void;
  onTapPan: (side: Side) => void;
}) {
  const angle = tilt(round);
  const solved = isBalanced(round);
  const lift = ARM * Math.sin((angle * Math.PI) / 180);
  const on = (side: Side) => [
    ...(side === 'left' ? round.given : []),
    ...round.placed
      .filter((p) => p.side === side)
      .map((p) => round.shelf[p.id]),
  ];

  // A fruit can be tapped onto the right pan, or dragged onto either.
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean }>(
    undefined
  );
  const dragged = useRef(false);
  const [ghost, setGhost] = useState<{ id: number; x: number; y: number }>();

  const down = (e: PointerEvent<HTMLButtonElement>, id: number) => {
    if (isPlaced(round, id) || solved) return;
    drag.current = { id, x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10) return;
    d.moved = true;
    setGhost({ id: d.id, x: e.clientX, y: e.clientY });
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = undefined;
    setGhost(undefined);
    if (!d?.moved) return;
    dragged.current = true;
    const target = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find((el) => el instanceof Element && el.closest('[data-side]'))
      ?.closest('[data-side]');
    const side = target?.getAttribute('data-side') as Side | null;
    if (side) onPlace(d.id, side);
  };
  const click = (id: number) => {
    // A drag ends in a click too; it was handled when it was dropped.
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (isPlaced(round, id)) onTakeOff(id);
    else onPlace(id, 'right');
  };

  const pan = (side: Side) => {
    const x = side === 'left' ? PIVOT.x - ARM : PIVOT.x + ARM;
    const dy = side === 'left' ? -lift : lift;
    return (
      <g
        className='pan'
        style={{ transform: `translate(${x}px, ${PIVOT.y + dy}px)` }}
      >
        <path className='scale__string' d={`M0 0 -50 ${DISH}M0 0 50 ${DISH}`} />
        <Load things={on(side)} level={round.level} />
        <path
          className='scale__pan'
          d={`M-57 ${DISH}h114a57 16 0 0 1-114 0z`}
        />
      </g>
    );
  };

  return (
    <div className={solved ? 'board board--solved' : 'board'}>
      <svg className='scale' viewBox='0 0 340 250' aria-hidden='true'>
        <path
          className='scale__stand'
          d={`M${PIVOT.x} ${PIVOT.y}V238M${PIVOT.x - 40} 240h80`}
        />
        <g
          className='beam'
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
          }}
        >
          <path
            className='scale__beam'
            d={`M${PIVOT.x - ARM} ${PIVOT.y}H${PIVOT.x + ARM}`}
          />
        </g>
        <circle className='scale__pivot' cx={PIVOT.x} cy={PIVOT.y} r={8} />
        {pan('left')}
        {pan('right')}
        {/* Where a dragged fruit can land, and a tap takes the last one off. */}
        <rect
          className='scale__half'
          data-side='left'
          x={0}
          y={0}
          width={PIVOT.x}
          height={250}
          onClick={() => onTapPan('left')}
        />
        <rect
          className='scale__half'
          data-side='right'
          x={PIVOT.x}
          y={0}
          width={PIVOT.x}
          height={250}
          onClick={() => onTapPan('right')}
        />
      </svg>

      {/* Once level, the card for the next round takes its place. */}
      {!solved && (
        <div className='shelf'>
          {round.shelf.map((thing, id) => (
            <button
              key={id}
              className={isPlaced(round, id) ? 'fruit fruit--placed' : 'fruit'}
              onPointerDown={(e) => down(e, id)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => {
                drag.current = undefined;
                setGhost(undefined);
              }}
              onClick={() => click(id)}
              disabled={solved}
              aria-label={`${thing.look} ${thing.weight}`}
            >
              <span className='fruit__look'>{thing.look}</span>
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
          style={{ left: ghost.x, top: ghost.y }}
          aria-hidden='true'
        >
          {round.shelf[ghost.id].look}
        </div>
      )}
    </div>
  );
}
