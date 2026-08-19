import { describe, expect, it } from 'vitest';

import padRightWithLength from './padRightWithLength';

describe('padRightWithLength function', () => {
  it('correctly pads a shorter string', () => {
    const padRight = padRightWithLength(10);
    expect(padRight('test')).toMatchInlineSnapshot('"test       "');
  });

  it('does not pad a string of the exact length', () => {
    const padRight = padRightWithLength(4);
    expect(padRight('test')).toMatchInlineSnapshot('"test "');
  });

  it('does not shorten a longer string', () => {
    const padRight = padRightWithLength(3);
    expect(padRight('testing')).toMatchInlineSnapshot('"testing"');
  });

  it('handles an empty string', () => {
    const padRight = padRightWithLength(5);
    expect(padRight('')).toMatchInlineSnapshot('"      "');
  });
});
