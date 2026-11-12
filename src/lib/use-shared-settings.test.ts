import { describe, expect, it } from 'vitest';

import { parseLanguage, parseSound } from './use-shared-settings';

describe('shared language', () => {
  it('reads a saved language', () => {
    expect(parseLanguage('"auto"')).toBe('auto');
    expect(parseLanguage('"en"')).toBe('en');
    expect(parseLanguage('"hr"')).toBe('hr');
  });

  it('ignores anything else', () => {
    expect(parseLanguage(null)).toBeUndefined();
    expect(parseLanguage('')).toBeUndefined();
    expect(parseLanguage('hr')).toBeUndefined();
    expect(parseLanguage('"de"')).toBeUndefined();
    expect(parseLanguage('{"language":"hr"}')).toBeUndefined();
  });
});

describe('shared sound', () => {
  it('reads on or off', () => {
    expect(parseSound('true')).toBe(true);
    expect(parseSound('false')).toBe(false);
  });

  it('ignores anything else', () => {
    expect(parseSound(null)).toBeUndefined();
    expect(parseSound('')).toBeUndefined();
    expect(parseSound('"false"')).toBeUndefined();
    expect(parseSound('0')).toBeUndefined();
  });
});
