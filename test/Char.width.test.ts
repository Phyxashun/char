// ./test/Char.width.test.ts

import { describe, it, expect } from 'vitest';
import { Char } from '../src/Char';

// Replicating the enum from the method for clear test cases
enum Width {
  Undefined,
  Single,
  Double
}

describe('Char.getVisualWidth', () => {

  // Test data covering a wide range of Unicode character types
  const testCases: { description: string, char: string, expected: Width; }[] = [

    // 1. Basic Single-Width Characters
    { description: 'should return Single for a standard letter', char: 'A', expected: Width.Single },
    { description: 'should return Single for a standard number', char: '1', expected: Width.Single },
    { description: 'should return Single for a standard symbol', char: '!', expected: Width.Single },
    { description: 'should return Single for a box-drawing character', char: '─', expected: Width.Single },
    { description: 'should return Single for a Roman numeral symbol', char: 'Ⅷ', expected: Width.Single },

    // 2. Escaped String Representations (your custom logic)
    { description: 'should return Double for escaped newline string', char: '\\n', expected: Width.Double },
    { description: 'should return Double for escaped tab string', char: '\\t', expected: Width.Double },

    // 3. Emoji and Symbols (Double Width)
    { description: 'should return Double for a common emoji (Emoji_Presentation)', char: '😂', expected: Width.Double },
    { description: 'should return Double for a symbol with variation selector', char: '⚔️', expected: Width.Double },
    { description: 'should return Double for a medal with variation selector', char: '🎖️', expected: Width.Double },
    { description: 'should return Double for the military helmet (Emoji property)', char: '🪖', expected: Width.Double },
    { description: 'should return Double for the bicep emoji (Emoji property)', char: '💪', expected: Width.Double },

    // 4. Full-width and CJK characters (Double Width)
    { description: 'should return Double for a full-width Latin letter', char: 'Ａ', expected: Width.Double },
    { description: 'should return Double for a full-width number', char: '５', expected: Width.Double },
    { description: 'should return Double for a Japanese Hiragana character', char: 'あ', expected: Width.Double },
    { description: 'should return Double for a Korean Hangul syllable', char: '한', expected: Width.Double },
    { description: 'should return Double for a Chinese Han character', char: '字', expected: Width.Double },

    // 5. Combining Marks (should not add width)
    { description: 'should return Single for a letter with a combining mark', char: 'é', expected: Width.Single },
    { description: 'should return Single for a letter with multiple combining marks', char: 'ő', expected: Width.Single },
    { description: 'should return Double for an emoji with a combining mark', char: '😂🏾', expected: Width.Double },

    // 6. Edge Cases
    { description: 'should return Undefined for an empty string', char: '', expected: Width.Undefined },
    { description: 'should return Single for a single space', char: ' ', expected: Width.Single },
  ];

  // Dynamically generate a test for each case
  for (const { description, char, expected } of testCases) {
    it(description, () => {
      const result = Char.getVisualWidth(char);
      expect(result).toBe(expected);
    });
  }

  // A specific test to demonstrate a complex grapheme cluster
  it('should correctly handle a complex grapheme cluster like a family emoji', () => {
    // This is a single visual character composed of 7 code points!
    const familyEmoji = '👨‍👩‍👧‍👦';
    expect(Char.getVisualWidth(familyEmoji)).toBe(Width.Double);
  });

});