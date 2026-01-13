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