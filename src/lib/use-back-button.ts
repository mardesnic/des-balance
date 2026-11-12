import { useEffect, useRef } from 'react';

// The phone's Back button closes a menu (New game, Settings) instead of
// leaving the app. Opening a menu adds a history entry for Back to take;
// closing it with a button takes that entry off again. Back with no menu
// open, or on the first New game screen, leaves the app as usual.

const MARK = 'des-menu';

const hasEntry = () =>
  (window.history.state as Record<string, unknown> | null)?.[MARK] === true;

// Call when a menu opens over the game.
export function pushMenu() {
  if (!hasEntry()) window.history.pushState({ [MARK]: true }, '');
}

// Call when a menu is closed by a button (Done, Cancel, a level).
export function popMenu() {
  if (hasEntry()) window.history.back();
}

// `onBack` should go back to the game. It may also run after popMenu, so it
// must be harmless when the game is already showing.
export function useBackButton(onBack: () => void) {
  const latest = useRef(onBack);
  useEffect(() => {
    latest.current = onBack;
  });

  useEffect(() => {
    const onPop = () => latest.current();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
