// Required
import { describe, expect, it, vi } from 'vitest';

import logList from './logList';

vi.mock('chalk', () => ({
  default: {
    bold: vi.fn((str) => `**${str}**`),
    green: vi.fn((str) => `green(${str})`),
    red: vi.fn((str) => `red(${str})`),
  },
}));
vi.mock('../../utils/padRightWithLength', () => ({
  default: vi.fn(() => (str) => `padded(${str})`),
}));
vi.mock('../../utils/clean', () => ({ default: vi.fn((str) => `cleaned(${str})`) }));

describe('logList function', () => {
  it('correctly formats and logs list items', () => {
    const mockLog = vi.fn();
    const list = [
      ['Item1', true, ' Comment1'],
      ['Item2', false],
      ['Item3', 'Value3'],
    ];

    logList(mockLog, list);

    expect(mockLog).toHaveBeenCalledWith('cleaned(**padded(Item1)** green(true) Comment1)');
    expect(mockLog).toHaveBeenCalledWith('cleaned(**padded(Item2)** red(false))');
    expect(mockLog).toHaveBeenCalledWith('cleaned(**padded(Item3)** Value3)');
  });
});
