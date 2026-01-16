

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./test/Char.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Char, Position } from '../src/Char';
import { inspect } from 'node:util';

describe('Char Custom Inspector', () => {
    const mockStylize = vi.fn((str: string, styleType: string) => {
        // A simple mock that wraps the content to make assertions easier.
        return `[${styleType}:${str}]`;
    });

    const mockOptions = {
        stylize: mockStylize,
    };

    const mockInspectFn = vi.fn();

    // Clear mocks before each test to ensure isolation
    beforeEach(() => {
        mockStylize.mockClear();
        mockInspectFn.mockClear();
    });

    it('formats a standard standalone character with correct padding', () => {
        const char = new Char('!');
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        /**
         * LOGIC CHECK:
         * visualWidth('!') -> 1.
         * contentWidth -> 1 (char) + 2 (quotes) = 3.
         * targetWidth -> 8.
         * totalPadding -> 8 - 3 = 5.
         * paddingStart -> floor(2.5) = 2.
         * paddingEnd -> ceil(2.5) = 3.
         * Final padded string: "  '!'   "
         */
        expect(result).toContain("[date:  '!'   ]");
        expect(result).toContain('[special:Char]');
    });

    it('formats a substring character with position and index info', () => {
        const char = new Char('G', {
            isSubstring: true,
            position: new Position(10, 2, 5),
        });
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        // Check for the index part
        expect(result).toContain('[number:[10]]');
        // Check for the line:column part, ensuring spacing from padStart is correct
        expect(result).toContain('[number:[  2 :  5 ]]');
    });

    it('handles depth exhaustion gracefully', () => {
        const char = new Char('X');
        const result = (char as any)[inspect.custom](-1, mockOptions, mockInspectFn);
        expect(result).toBe('[special:[Char]]');
    });

    it('escapes and pads newline characters correctly', () => {
        const char = new Char('\n');
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        /**
         * LOGIC CHECK:
         * toString() -> '\\n'
         * visualWidth -> handleEscape gives '\\\\n', length is 2.
         * contentWidth -> 2 (char) + 2 (quotes) = 4.
         * targetWidth -> 8.
         * totalPadding -> 8 - 4 = 4.
         * paddingStart -> 2.
         * paddingEnd -> 2.
         * Final padded string: "  '\\n'  "
         */
        expect(result).toContain("[date:  '\\n'  ]");
    });
});





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./test/Char.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./test/CharSpec.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./test/Char.width.test.ts

import { describe, it, expect } from 'vitest';
import { Char } from '../src/Char';

// The method now returns a number: 0 (for null/undefined width), 1 (single), or 2 (double).
const IS_NULL = 0;
const SINGLE_WIDTH = 1;
const DOUBLE_WIDTH = 2;

describe('Char.calculateVisualWidth', () => {
    const testCases: { description: string; char: string; expected: number }[] = [
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





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./test/CharSpec.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./test/CharType.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./test/CharType.test.ts

import { describe, it, expect } from 'vitest';
import { CharType } from '../src/CharType';

describe('CharType Enum', () => {
    it('should have the expected control types', () => {
        expect(CharType.EOF).toBe('EOF');
        expect(CharType.Undefined).toBe('Undefined');
    });

    it('should have the expected literal types', () => {
        expect(CharType.Letter).toBe('Letter');
        expect(CharType.Number).toBe('Number');
        expect(CharType.Emoji).toBe('Emoji');
    });
});





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./test/CharType.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./test/Char.inspect.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Char, Position } from '../src/Char';
import { inspect } from 'node:util';

describe('Char Custom Inspector', () => {
    const mockStylize = vi.fn((str: string, styleType: string) => {
        // A simple mock that wraps the content to make assertions easier.
        return `[${styleType}:${str}]`;
    });

    const mockOptions = {
        stylize: mockStylize,
    };

    const mockInspectFn = vi.fn();

    // Clear mocks before each test to ensure isolation
    beforeEach(() => {
        mockStylize.mockClear();
        mockInspectFn.mockClear();
    });

    it('formats a standard standalone character with correct padding', () => {
        const char = new Char('!');
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        /**
         * LOGIC CHECK:
         * visualWidth('!') -> 1.
         * contentWidth -> 1 (char) + 2 (quotes) = 3.
         * targetWidth -> 8.
         * totalPadding -> 8 - 3 = 5.
         * paddingStart -> floor(2.5) = 2.
         * paddingEnd -> ceil(2.5) = 3.
         * Final padded string: "  '!'   "
         */
        expect(result).toContain("[date:  '!'   ]");
        expect(result).toContain('[special:Char]');
    });

    it('formats a substring character with position and index info', () => {
        const char = new Char('G', {
            isSubstring: true,
            position: new Position(10, 2, 5),
        });
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        // Check for the index part
        expect(result).toContain('[number:[10]]');
        // Check for the line:column part, ensuring spacing from padStart is correct
        expect(result).toContain('[number:[  2 :  5 ]]');
    });

    it('handles depth exhaustion gracefully', () => {
        const char = new Char('X');
        const result = (char as any)[inspect.custom](-1, mockOptions, mockInspectFn);
        expect(result).toBe('[special:[Char]]');
    });

    it('escapes and pads newline characters correctly', () => {
        const char = new Char('\n');
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        /**
         * LOGIC CHECK:
         * toString() -> '\\n'
         * visualWidth -> handleEscape gives '\\\\n', length is 2.
         * contentWidth -> 2 (char) + 2 (quotes) = 4.
         * targetWidth -> 8.
         * totalPadding -> 8 - 4 = 4.
         * paddingStart -> 2.
         * paddingEnd -> 2.
         * Final padded string: "  '\\n'  "
         */
        expect(result).toContain("[date:  '\\n'  ]");
    });
});





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./test/Char.inspect.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./test/Char.width.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./test/Char.width.test.ts

import { describe, it, expect } from 'vitest';
import { Char } from '../src/Char';

// The method now returns a number: 0 (for null/undefined width), 1 (single), or 2 (double).
const IS_NULL = 0;
const SINGLE_WIDTH = 1;
const DOUBLE_WIDTH = 2;

describe('Char.calculateVisualWidth', () => {
    const testCases: { description: string; char: string; expected: number }[] = [
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





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./test/Char.width.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████
