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
            position: new Position(10, 2, 5)
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
