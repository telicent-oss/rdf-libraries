import fs from 'fs';
import { describe, expect, it, vi } from 'vitest';

import getRealPath from './getRealPath';

vi.mock('fs');

describe('getRealPath function', () => {
  it('returns the real path for a valid path', () => {
    const mockPath = '/path/to/file';
    const mockRealPath = '/real/path/to/file';
    fs.realpathSync.mockReturnValue(mockRealPath);

    const result = getRealPath(mockPath);
    expect(result).toBe(mockRealPath);
  });

  it('returns "Unknown" for an invalid path', () => {
    const mockPath = '/invalid/path';
    fs.realpathSync.mockImplementation(() => {
      throw new Error('Path not found');
    });

    const result = getRealPath(mockPath);
    expect(result).toBe('Unknown');
  });
});
