import fs from 'fs';
import { describe, expect, it, vi } from 'vitest';

import formatJsonFile from './formatJsonFile';

vi.mock('fs');

describe('formatJsonFile function', () => {
  it('formats valid JSON file correctly', () => {
    const mockJson = { key: 'value' };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockJson));

    const filePath = 'valid.json';
    const output = formatJsonFile(filePath);

    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    expect(output).toMatchInlineSnapshot(`
      "  {
          key: [32m'value'[39m
        }"
    `);
  });

  it('handles invalid JSON file', () => {
    fs.readFileSync.mockReturnValue('invalid json');

    const filePath = 'invalid.json';
    expect(() => formatJsonFile(filePath)).toThrow(/Unexpected token/);
  });

  it('handles empty or non-existent file path', () => {
    fs.readFileSync.mockReturnValue('');

    const filePath = 'empty.json';
    expect(() => formatJsonFile(filePath)).toThrowErrorMatchingInlineSnapshot(
      '[SyntaxError: Unexpected end of JSON input]',
    );
  });
});
