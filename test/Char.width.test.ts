// ./test/Char.width.test.ts

import { describe, it, expect } from 'vitest';
import { Char } from '../src/Char';

// The method now returns a number: 0 (for null/undefined width), 1 (single), or 2 (double).
const IS_NULL = 0;
const SINGLE_WIDTH = 1;
const DOUBLE_WIDTH = 2;

describe('Char.calculateVisualWidth', () => {
  const testCases: { description: string, char: string, expected: number; }[] = [
    // 1. Basic Single-Width Characters
    { description: 'should return 1 for a standard letter', char: 'A', expected: SINGLE_WIDTH },
    { description: 'should return 1 for a standard number', char: '1', expected: SINGLE_WIDTH },
    { description: 'should return 1 for a standard symbol', char: '!', expected: SINGLE_WIDTH },
    { description: 'should return 1 for a box-drawing character', char: '─', expected: SINGLE_WIDTH },
    { description: 'should return 1 for a Roman numeral symbol', char: 'Ⅷ', expected: SINGLE_WIDTH },

    // 2. Escaped String Representations (custom logic)
    // The handleEscape method returns '\\n', which has a length of 2.
    { description: 'should return 2 for escaped newline string representation', char: '\n', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for escaped tab string representation', char: '\t', expected: DOUBLE_WIDTH },

    // 3. Emoji and Symbols (Double Width)
    { description: 'should return 2 for a common emoji (Emoji_Presentation)', char: '😂', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for a symbol with variation selector', char: '⚔️', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for a medal with variation selector', char: '🎖️', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for the military helmet (Emoji property)', char: '🪖', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for the bicep emoji (Emoji property)', char: '💪', expected: DOUBLE_WIDTH },

    // 4. Full-width and CJK characters (Double Width)
    { description: 'should return 2 for a full-width Latin letter', char: 'Ａ', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for a full-width number', char: '５', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for a Japanese Hiragana character', char: 'あ', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for a Korean Hangul syllable', char: '한', expected: DOUBLE_WIDTH },
    { description: 'should return 2 for a Chinese Han character', char: '字', expected: DOUBLE_WIDTH },

    // 5. Combining Marks (should not add width)
    { description: 'should return 1 for a letter with a combining mark', char: 'é', expected: SINGLE_WIDTH },
    { description: 'should return 1 for a letter with multiple combining marks', char: 'ő', expected: SINGLE_WIDTH },
    // NOTE: An emoji with a skin-tone modifier is still a single grapheme of width 2
    { description: 'should return 2 for an emoji with a combining mark', char: '😂🏾', expected: DOUBLE_WIDTH },

    // 6. Edge Cases
    { description: 'should return 0 for an empty string', char: '', expected: IS_NULL },
    { description: 'should return 1 for a single space', char: ' ', expected: SINGLE_WIDTH },
  ];

  // Dynamically generate a test for each case
  for (const { description, char, expected } of testCases) {
    it(description, () => {
      const result = Char.calculateVisualWidth(char);
      expect(result).toBe(expected);
    });
  }

  it('should correctly handle a complex grapheme cluster like a family emoji', () => {
    // This is a single visual character composed of 7 code points!
    const familyEmoji = '👨‍👩‍👧‍👦';
    expect(Char.calculateVisualWidth(familyEmoji)).toBe(DOUBLE_WIDTH);
  });

  it('should return 0 for an empty string', () => {
    // This test covers the IS_NULL return path (line 505)
    expect(Char.calculateVisualWidth('')).toBe(0);
  });
});

