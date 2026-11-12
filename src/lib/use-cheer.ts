import { useEffect } from 'react';

// A happy run up the scale and a little buzz when a puzzle is solved. The
// notes are made with Web Audio, so there are no files to load and it works
// offline. Phones without vibration (iPhones) just play the sound.

let ctx: AudioContext | undefined;

// Phones only let audio start from a tap, so it is woken on every tap. A win
// that comes later, after an animation, can then still play. iPhones only
// count the end of a touch, and report 'interrupted' after the app was away.
const TAPS = ['pointerup', 'touchend', 'keydown'] as const;

function wake() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state !== 'running') void ctx.resume();
  } catch {
    ctx = undefined; // No sound; the game still works.
  }
}

// A soft, bell-like tone: a sine with a quiet octave on top that rings out.
function tone(a: AudioContext, frequency: number, at: number, length: number) {
  const start = a.currentTime + at;
  const gain = a.createGain();
  gain.connect(a.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);

  for (const [mult, level, type] of [
    [1, 1, 'sine'],
    [2, 0.25, 'triangle'],
  ] as const) {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.value = frequency * mult;
    g.gain.value = level;
    osc.connect(g).connect(gain);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }
}

const NOTES = [261.63, 329.63, 392.0, 523.25, 659.25];

function cheer() {
  wake();
  try {
    if (ctx)
      NOTES.forEach((f, i) =>
        tone(ctx!, f, i * 0.09, i === NOTES.length - 1 ? 1.2 : 0.4)
      );
    navigator.vibrate?.([40, 60, 40, 60, 120]);
  } catch {
    // A celebration is nice to have; never let it break the game.
  }
}

const quiet = () => {};

// Returns the function to call on a win, which does nothing when `on` is off.
export function useCheer(on: boolean) {
  useEffect(() => {
    if (!on) return;
    for (const e of TAPS) window.addEventListener(e, wake, true);
    return () => {
      for (const e of TAPS) window.removeEventListener(e, wake, true);
    };
  }, [on]);

  return on ? cheer : quiet;
}
