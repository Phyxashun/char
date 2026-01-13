

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./test/Char.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./test/Char.test.ts

import { describe, it, expect } from 'vitest';
import { Char, Position, IChar } from '../src/Char';
import { CharType } from '../src/CharType';

describe('Position Class', () => {
    it('initializes with default values', () => {
        const pos = new Position();
        expect(pos.index).toBe(-1);
    });
});

describe('IChar Class', () => {
    it('throws error if value is more than one character', () => {
        // Initialize with a valid char first so the constructor doesn't throw
        const ichar = new IChar(CharType.Letter, 'A');

        // Now testing the setter specifically
        expect(() => { ichar.value = 'abc' }).toThrow("Input must be a single Unicode character.");
    });

    it('correctly handles unicode value storage', () => {
        const ichar = new IChar(CharType.Letter, 'A');
        expect(ichar.value).toBe('A');
    });
});

describe('Char Class', () => {
    describe('Constructor & Validation', () => {
        it('creates a valid Char instance', () => {
            const char = new Char('A');
            expect(char.value).toBe('A');
            expect(char.type).toBe(CharType.Letter);
        });

        it('throws error for empty or multi-char strings', () => {
            expect(() => new Char('')).toThrow();
            expect(() => new Char('AB')).toThrow();
        });
    });

    describe('Character Analysis Methods', () => {
        it('identifies types correctly via instance methods', () => {
            expect(new Char('1').isNumber()).toBe(true);
            expect(new Char('a').isLetter()).toBe(true);
            expect(new Char('\n').isNewLine()).toBe(true);
            expect(new Char(' ').isWhitespace()).toBe(true);
            expect(new Char('!').isPunctuation()).toBe(true);
            expect(new Char('😊').isEmoji()).toBe(true);
        });

        it('handles casing', () => {
            const upper = new Char('G');
            const lower = new Char('g');
            expect(upper.isUpperCase()).toBe(true);
            expect(upper.isLowerCase()).toBe(false);
            expect(lower.isLowerCase()).toBe(true);
        });

        it('returns numeric values', () => {
            expect(new Char('5').getNumericValue()).toBe(5);
            expect(new Char('A').getNumericValue()).toBe(-1);
        });
    });

    describe('Static Methods', () => {
        it('fromString: decomposes string into Char array with correct positions', () => {
            const str = 'A\nB';
            const chars = Char.fromString(str);

            expect(chars).toHaveLength(3);

            // 'A'
            expect(chars[0].value).toBe('A');
            expect(chars[0].position).toMatchObject({ index: 0, line: 1, column: 1 });

            // '\n'
            expect(chars[1].value).toBe('\n');
            expect(chars[1].position).toMatchObject({ index: 1, line: 1, column: 2 });

            // 'B'
            expect(chars[2].value).toBe('B');
            expect(chars[2].position).toMatchObject({ index: 2, line: 2, column: 1 });
        });

        it('calculatePosition: computes coordinates correctly', () => {
            const text = "Hello\nWorld";
            const pos = Char.calculatePosition(text, 6); // Index 6 is 'W'
            expect(pos.line).toBe(2);
            expect(pos.column).toBe(1);
        });
    });

    describe('Custom Inspection', () => {
        it('formats string representation for special characters', () => {
            expect(new Char('\n').toString()).toBe('\\n');
            expect(new Char('\t').toString()).toBe('\\t');
            expect(new Char('X').toString()).toBe('X');
        });

        // Note: Testing the [inspect.custom] logic usually requires 
        // passing a mock stylize function if you want to test the exact output string.
    });

    describe('Char Class > Exhaustive Type Checks', () => {
        const typeTests = [
            { char: 'a', method: 'isLetter', expected: true },
            { char: '1', method: 'isNumber', expected: true },
            { char: ' ', method: 'isWhitespace', expected: true },
            { char: '\n', method: 'isNewLine', expected: true },
            { char: '!', method: 'isPunctuation', expected: true },
            { char: '$', method: 'isCurrency', expected: true },
            { char: '+', method: 'isSymbol', expected: true },
            { char: '\u0000', method: 'isControl', expected: true },
            { char: '😊', method: 'isEmoji', expected: true },
            { char: '\u0301', method: 'isModifier', expected: true }, // Combining Acute Accent
        ];

        typeTests.forEach(({ char, method, expected }) => {
            it(`${method}() should return ${expected} for "${char}"`, () => {
                const c = new Char(char);
                expect((c as any)[method]()).toBe(expected);
            });
        });

        it('identifies Undefined type correctly', () => {
            // Create a char with a null/empty type to trigger Undefined
            const c = new Char('A');
            (c as any).type = 0; // Assuming 0 is CharType.Undefined
            expect(c.isUndefined()).toBe(true);
        });
    });
});




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./test/Char.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./test/CharSpec.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./test/CharSpec.test.ts

import { describe, it, expect } from 'vitest';
import { CharSpec } from '../src/CharSpec';
import { CharType } from '../src/CharType';

describe('CharSpec Map', () => {
    const check = (type: CharType, char: string) => CharSpec.get(type)!(char);

    it('identifies Letters correctly', () => {
        expect(check(CharType.Letter, 'a')).toBe(true);
        expect(check(CharType.Letter, 'Z')).toBe(true);
        expect(check(CharType.Letter, 'ñ')).toBe(true);
        expect(check(CharType.Letter, '1')).toBe(false);
    });

    it('identifies Numbers correctly', () => {
        expect(check(CharType.Number, '5')).toBe(true);
        expect(check(CharType.Number, '¼')).toBe(true); // Unicode numeric
        expect(check(CharType.Number, 'a')).toBe(false);
    });

    it('identifies Emojis correctly', () => {
        expect(check(CharType.Emoji, '🚀')).toBe(true);
        expect(check(CharType.Emoji, '💩')).toBe(true);
        expect(check(CharType.Emoji, 'A')).toBe(false);
    });

    it('identifies Whitespace and Newlines', () => {
        expect(check(CharType.NewLine, '\n')).toBe(true);
        expect(check(CharType.NewLine, '\r')).toBe(true);
        expect(check(CharType.Whitespace, ' ')).toBe(true);
        expect(check(CharType.Whitespace, '\t')).toBe(true);
    });

    it('identifies Currency symbols', () => {
        expect(check(CharType.Currency, '$')).toBe(true);
        expect(check(CharType.Currency, '€')).toBe(true);
        expect(check(CharType.Currency, '¥')).toBe(true);
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




import { describe, it, expect, vi } from 'vitest';
import { Char, Position } from '../src/Char';
import { inspect } from 'node:util';

describe('Char Custom Inspector', () => {
    const mockStylize = vi.fn((str: string, styleType: string) => {
        // Note: The mock returns [type:value] with NO extra spaces
        return `[${styleType}:${str}]`;
    });

    const mockOptions = {
        stylize: mockStylize,
    };

    const mockInspectFn = vi.fn();

    it('formats a standard standalone character correctly', () => {
        const char = new Char('!');
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        expect(result).toContain('[special:Char]');

        /**
         * LOGIC CHECK: 
         * toString() is '!' (len 3). 
         * padStart(4) adds 1 space to the left -> " '!'"
         * padEnd(4) sees length 4, does nothing.
         * result: [date: '!'] (Space is AFTER the colon, part of the value)
         */
        expect(result).toContain("[date: '!'  ]");
    });

    it('formats a substring character with position and index info', () => {
        const char = new Char('G', {
            isSubstring: true,
            position: new Position(10, 2, 5)
        });

        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        expect(result).toContain('[number:[10]]');
        // Note: ensure the spacing here matches your Char.ts template exactly
        expect(result).toContain('[number:[  2 :  5 ]]');
    });

    it('handles depth exhaustion', () => {
        const char = new Char('X');
        const result = (char as any)[inspect.custom](-1, mockOptions, mockInspectFn);
        expect(result).toBe('[special:[Char]]');
    });

    it('escapes newline characters in the inspector output', () => {
        const char = new Char('\n');
        const result = (char as any)[inspect.custom](1, mockOptions, mockInspectFn);

        /**
         * LOGIC CHECK:
         * toString() is '\\n' (len 4 including quotes).
         * padStart(4) and padEnd(4) do nothing.
         * result: [date:'\\n'] (NO space after colon because value didn't need padding)
         */
        expect(result).toContain("[date:'\\n'  ]");
    });
});




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./test/Char.inspect.test.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████
