import fs from 'fs';
import { describe, expect, it, vi } from 'vitest';

import { checkTefeJson, createTefeJson, getTefeJson, TEFE_CONFIG } from './tefe.config.json.utils';

vi.mock('fs');

describe('TEFE JSON Functions', () => {
  describe('getTefeJson', () => {
    it('returns JSON when file exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ version: '1.0.0' }));

      const json = getTefeJson();
      expect(json).toEqual({ version: '1.0.0' });
    });

    it('returns undefined when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const json = getTefeJson();
      expect(json).toBeUndefined();
    });
  });

  describe('checkTefeJson', () => {
    it('throws error if version field is missing', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({}));

      expect(() => checkTefeJson()).toThrow('Expected "version" (string) field in');
    });

    it('returns true if version field exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ version: '1.0.0' }));

      expect(checkTefeJson()).toBe(true);
    });

    it('throws error if TEFE config file is not found', () => {
      fs.existsSync.mockReturnValue(false);

      expect(() => checkTefeJson()).toThrow(
        `Perhaps file not created? could not find: ${TEFE_CONFIG}`,
      );
    });
  });

  describe('createTefeJson', () => {
    it('throws error if TEFE config already exists', () => {
      fs.existsSync.mockReturnValue(true);

      expect(() => createTefeJson()).toThrow(`Cannot create already existing: ${TEFE_CONFIG}`);
    });

    it('creates TEFE config if it does not exist', () => {
      fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ version: '1.0.0' }));
      fs.writeFileSync.mockImplementation(() => {});

      expect(createTefeJson()).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        TEFE_CONFIG,
        expect.stringContaining('"version": "1.0.0"'),
        'utf-8',
      );
    });
  });
});
