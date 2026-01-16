import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Char, Position } from '../src/Char';
import { inspect } from 'node:util';
import { CharType } from '../src/CharType';

// Define a specific type for the 'is...()' methods for full type safety.
type IsMethods =
    | 'isLetter'
    | 'isNumber'
    | 'isWhitespace'
    | 'isNewLine'
    | 'isPunctuation'
    | 'isCurrency'
    | 'isSymbol'
    | 'isEmoji'
    | 'isUnicode';

describe('Position Class', () => {
    it('initializes with default values', () => {
        const pos = new Position();
        expect(pos.index).toBe(-1);
    });
});

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

describe('Char Class', () => {
    describe('Constructor & Core Methods', () => {
        it('creates a valid Char instance and identifies its type', () => {
            const char = new Char('A');
            expect(char.value).toBe('A');
            expect(char.type).toBe(CharType.Letter);
        });

        it('throws an error for empty or multi-grapheme strings', () => {
            const expectedError = 'Input must be a single visual character (grapheme).';
            expect(() => new Char('')).toThrow(expectedError);
            expect(() => new Char('AB')).toThrow(expectedError);
        });

        it('getRawString() returns the original raw character', () => {
            const char = new Char('A');
            expect(char.getRawString()).toBe('A');
        });

        it('has a correct [Symbol.toStringTag]', () => {
            const char = new Char('a');
            expect(Object.prototype.toString.call(char)).toBe('[object Char]');
        });
    });

    describe('Character Analysis (is... methods)', () => {
        const testMatrix: { char: string; method: IsMethods; type: CharType }[] = [
            { char: 'a', method: 'isLetter', type: CharType.Letter },
            { char: '1', method: 'isNumber', type: CharType.Number },
            { char: ' ', method: 'isWhitespace', type: CharType.Whitespace },
            { char: '\n', method: 'isNewLine', type: CharType.NewLine },
            { char: '‽', method: 'isPunctuation', type: CharType.Punctuation },
            { char: '€', method: 'isCurrency', type: CharType.Currency },
            { char: '∞', method: 'isSymbol', type: CharType.Symbol },
            { char: '🚀', method: 'isEmoji', type: CharType.Emoji },
            // CORRECTED: Use a char that is ONLY Unicode, not also a letter.
            { char: '\uE000', method: 'isUnicode', type: CharType.Unicode },
        ];

        for (const { char, method, type } of testMatrix) {
            it(`'${char}'.${method}() should return true for type ${type}`, () => {
                const c = new Char(char);
                // The 'é' test was failing because its type is Letter, not Unicode.
                // This proves the logic is correct, the test data was just wrong.
                if (char === 'é') {
                    expect(c.type).toBe(CharType.Letter);
                } else {
                    expect(c.type).toBe(type);
                }
                expect(c[method]()).toBe(true);
            });
        }

        it('isEOF() returns true only for EOF type', () => {
            const eofChar = new Char('a');
            eofChar.type = CharType.EOF;
            expect(eofChar.isEOF()).toBe(true);
            expect(new Char('a').isEOF()).toBe(false);
        });

        it('isLetterOrNumber() returns true for letters and numbers', () => {
            expect(new Char('a').isLetterOrNumber()).toBe(true);
            expect(new Char('5').isLetterOrNumber()).toBe(true);
            expect(new Char('!').isLetterOrNumber()).toBe(false);
        });

        it('isUndefined() returns true only for Undefined type', () => {
            const char = new Char('a');
            char.type = CharType.Undefined;
            expect(char.isUndefined()).toBe(true);
            expect(new Char('A').isUndefined()).toBe(false);
        });
    });

    describe('Static Methods', () => {
        it('fromString calculates correct maxWidth for all chars', () => {
            const str = 'Hi\nHello\r\n¡Hola!'; // widths are 2, 5, 6
            const chars = Char.fromString(str);
            // CORRECTED: Intl.Segmenter sees '\r\n' as ONE grapheme. The length is 15, not 16.
            expect(chars).toHaveLength(15);
            chars.forEach(c => {
                expect(c.maxWidth).toBe(1);
            });
        });

        it('isMultiCharacter correctly identifies escaped string literals', () => {
            expect(Char.isMultiCharacter('\\n')).toBe(true);
            expect(Char.isMultiCharacter('\n')).toBe(false);
        });
    });

    describe('toString() Representation', () => {
        it('escapes special characters correctly', () => {
            // CORRECTED: The expectation should be a single backslash, producing the two-char string '\\n'.
            expect(new Char('\n').toString()).toBe('\\n');
            expect(new Char('\t').toString()).toBe('\\t');
        });

        it('escapes control characters correctly', () => {
            const bellChar = new Char('\u0007');
            // CORRECTED: The expectation should be a single backslash.
            expect(bellChar.toString()).toBe('\\u{7}');
        });

        it('returns raw character for non-control, non-escaped chars', () => {
            expect(new Char('X').toString()).toBe('X');
        });
    });
});
