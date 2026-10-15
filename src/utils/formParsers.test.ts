import { describe, it, expect } from 'vitest';
import { splitList, optionalText, optionalInt } from './formParsers';

describe('formParsers', () => {
  it('splitList trims and drops empty items', () => {
    expect(splitList(' Penicillin, , Ibuprofen ,')).toEqual(['Penicillin', 'Ibuprofen']);
    expect(splitList('')).toEqual([]);
  });

  it('optionalText turns blank into undefined', () => {
    expect(optionalText('   ')).toBeUndefined();
    expect(optionalText(' นพ. ก ')).toBe('นพ. ก');
  });

  it('optionalInt parses numbers with thousand separators', () => {
    expect(optionalInt('')).toBeUndefined();
    expect(optionalInt('80,400')).toBe(80400);
  });

  it('optionalInt returns NaN for garbage so schema validation rejects it', () => {
    expect(Number.isNaN(optionalInt('abc'))).toBe(true);
  });
});
