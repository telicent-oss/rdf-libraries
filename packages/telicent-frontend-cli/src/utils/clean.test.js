import { describe, expect, it } from 'vitest';

import clean from './clean';

describe('clean function', () => {
  it('replaces /Users/<username>/ with ~', () => {
    const input = '/Users/johndoe/path/to/file';
    const output = clean(input);
    expect(output).toBe('~/path/to/file');
  });

  it('works with different usernames', () => {
    expect(clean('/Users/special.chars!$/path')).toBe('~/path');
    expect(clean('/Users/anotherUser/path')).toBe('~/path');
  });

  it('does not alter non-matching strings', () => {
    const input = '/OtherPath/without/users/';
    expect(clean(input)).toBe(input);
  });

  it('handles multiple occurrences', () => {
    const input = '/Users/user1/path/Users/user2/path';
    expect(clean(input)).toBe('~/path~/path');
  });

  it('handles empty strings', () => {
    expect(clean('')).toBe('');
  });

  it('handles strings without slashes', () => {
    const input = 'JustAString';
    expect(clean(input)).toBe(input);
  });
});
