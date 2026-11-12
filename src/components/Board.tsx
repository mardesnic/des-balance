import type { Round } from '../lib/game';

// For now just the scale, level: the weights and the rules come next.
export function Board({ round }: { round: Round }) {
  return (
    <div className='board' data-level={round.level}>
      <svg className='scale' viewBox='0 0 240 160' aria-hidden='true'>
        <path className='scale__stand' d='M120 40v100M90 146h60' />
        <path className='scale__beam' d='M30 40h180' />
        <circle className='scale__pivot' cx='120' cy='40' r='7' />
        <path className='scale__string' d='M40 40 25 100M40 40l15 60' />
        <path className='scale__string' d='M200 40l-15 60M200 40l15 60' />
        <path className='scale__pan' d='M15 100h50a25 12 0 0 1-50 0z' />
        <path className='scale__pan' d='M175 100h50a25 12 0 0 1-50 0z' />
      </svg>
    </div>
  );
}
