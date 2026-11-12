import type { Level } from './game';

export const LANGS = ['en', 'hr'] as const;
export type Lang = (typeof LANGS)[number];
export type Language = 'auto' | Lang;

// Each language's name in that language, for the picker.
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  hr: 'Hrvatski',
};

export function detectLang(): Lang {
  const preferred = navigator.languages ?? [navigator.language];
  return preferred.some((l) => l.toLowerCase().startsWith('hr')) ? 'hr' : 'en';
}

const en = {
  title: 'Balance',
  newGame: 'New game',
  settings: 'Settings',
  close: 'Close',
  levels: {
    veryEasy: 'Very easy',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  } as Record<Level, string>,
  goal: 'Make both sides level',
  goalHard: 'Fruit can go on either side',
  undo: 'Undo',
  startOver: 'Start over',
  solved: 'Well done!',
  next: 'Next',
  changeLevel: 'Change level',
  language: 'Language',
  automatic: 'Automatic',
  sound: 'Sound and vibration',
  on: 'On',
  off: 'Off',
  statistics: 'Statistics',
  solvedColumn: 'Solved',
  allGames: 'All games',
  source: 'Source',
  version: 'Version',
};

export type Strings = typeof en;

const hr: Strings = {
  title: 'Vaga',
  newGame: 'Nova igra',
  settings: 'Postavke',
  close: 'Zatvori',
  levels: {
    veryEasy: 'Vrlo lagano',
    easy: 'Lagano',
    medium: 'Srednje',
    hard: 'Teško',
  },
  goal: 'Izjednači obje strane',
  goalHard: 'Voće smije i na lijevu stranu',
  undo: 'Poništi',
  startOver: 'Ispočetka',
  solved: 'Bravo!',
  next: 'Dalje',
  changeLevel: 'Promijeni razinu',
  language: 'Jezik',
  automatic: 'Automatski',
  sound: 'Zvuk i vibracija',
  on: 'Uključeno',
  off: 'Isključeno',
  statistics: 'Statistika',
  solvedColumn: 'Riješeno',
  allGames: 'Sve igre',
  source: 'Izvorni kod',
  version: 'Verzija',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
