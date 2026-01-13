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