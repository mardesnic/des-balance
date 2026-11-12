import { useEffect } from 'react';

// Keeps the screen on while the app is open. The browser drops the lock
// whenever the page is hidden, so it is requested again on return.
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let active = true;

    const request = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released))
        return;
      try {
        lock = await navigator.wakeLock.request('screen');
        if (!active) lock.release();
      } catch {
        // Refused, e.g. in battery saver; the screen just sleeps as usual.
      }
    };

    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', request);
      lock?.release();
    };
  }, []);
}
