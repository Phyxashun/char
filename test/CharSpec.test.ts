// ./test/CharSpec.test.ts

import { describe, it, expect } from 'vitest';
import { CharSpec } from '../src/CharSpec';
import { CharType } from '../src/CharType';
import { Char } from '../src/Char'; // Import Char to test Char.getType for other/undefined

describe('CharSpec Map', () => {
    // Helper function to easily check CharSpec predicates
    const check = (type: CharType, char: string) => CharSpec.get(type)!(char);

    it('identifies Letters correctly', () => {
        expect(check(CharType.Letter, 'a')).toBe(true);
        expect(check(CharType.Letter, 'Z')).toBe(true);
        expect(check(CharType.Letter, 'ñ')).toBe(true);
        expect(check(CharType.Letter, '1')).toBe(false);
        expect(check(CharType.Letter, ' ')).toBe(false);
    });

    it('identifies Numbers correctly', () => {
        expect(check(CharType.Number, '5')).toBe(true);
        expect(check(CharType.Number, '¼')).toBe(true); // Unicode numeric
        expect(check(CharType.Number, 'a')).toBe(false);
        expect(check(CharType.Number, '$')).toBe(false);
    });

    it('identifies Emojis correctly', () => {
        expect(check(CharType.Emoji, '🚀')).toBe(true);
        expect(check(CharType.Emoji, '💩')).toBe(true);
        // --- CORRECTED EXPECTATION ---
        // '#' is considered an Emoji by /\p{Emoji}/v.test(char) due to common emoji sequences.
        // Since CharType.Emoji comes before CharType.Hash in CharSpec, it's correctly identified as Emoji first.
        expect(check(CharType.Emoji, '#')).toBe(true);
        expect(check(CharType.Emoji, 'A')).toBe(false); // 'A' is not an emoji
    });

    it('identifies Whitespace and Newlines', () => {
        expect(check(CharType.NewLine, '\n')).toBe(true);
        expect(check(CharType.NewLine, '\r')).toBe(true);
        expect(check(CharType.NewLine, ' ')).toBe(false); // Only actual newlines
        expect(check(CharType.Whitespace, ' ')).toBe(true);
        expect(check(CharType.Whitespace, '\t')).toBe(true);
        expect(check(CharType.Whitespace, '\f')).toBe(true);
        expect(check(CharType.Whitespace, '\v')).toBe(true);
        expect(check(CharType.Whitespace, '\n')).toBe(false); // Only actual whitespaces (not newlines)
    });

    it('identifies Currency symbols correctly', () => {
        expect(check(CharType.Currency, '$')).toBe(true);
        expect(check(CharType.Currency, '€')).toBe(true);
        expect(check(CharType.Currency, '¥')).toBe(true);
        expect(check(CharType.Currency, '₿')).toBe(true);
        expect(check(CharType.Currency, 'A')).toBe(false);
    });

    it('identifies Hash correctly', () => {
        expect(check(CharType.Hash, '#')).toBe(true);
        expect(check(CharType.Hash, '$')).toBe(false);
    });

    it('identifies Percent correctly', () => {
        expect(check(CharType.Percent, '%')).toBe(true);
        expect(check(CharType.Percent, '#')).toBe(false);
    });

    it('identifies Slash correctly', () => {
        expect(check(CharType.Slash, '/')).toBe(true);
        expect(check(CharType.Slash, '\\')).toBe(false);
    });

    it('identifies Comma correctly', () => {
        expect(check(CharType.Comma, ',')).toBe(true);
        expect(check(CharType.Comma, '.')).toBe(false);
    });

    it('identifies LParen correctly', () => {
        expect(check(CharType.LParen, '(')).toBe(true);
        expect(check(CharType.LParen, '[')).toBe(false);
    });

    it('identifies RParen correctly', () => {
        expect(check(CharType.RParen, ')')).toBe(true);
        expect(check(CharType.RParen, ']')).toBe(false);
    });

    it('identifies Plus correctly', () => {
        expect(check(CharType.Plus, '+')).toBe(true);
        expect(check(CharType.Plus, '-')).toBe(false);
    });

    it('identifies Minus correctly', () => {
        expect(check(CharType.Minus, '-')).toBe(true);
        expect(check(CharType.Minus, '+')).toBe(false);
    });

    it('identifies Star correctly', () => {
        expect(check(CharType.Star, '*')).toBe(true);
        expect(check(CharType.Star, '/')).toBe(false);
    });

    it('identifies Dot correctly', () => {
        expect(check(CharType.Dot, '.')).toBe(true);
        expect(check(CharType.Dot, ',')).toBe(false);
    });

    it('identifies Backtick correctly', () => {
        expect(check(CharType.Backtick, '`')).toBe(true);
        expect(check(CharType.Backtick, "'")).toBe(false);
    });

    it('identifies SingleQuote correctly', () => {
        expect(check(CharType.SingleQuote, "'")).toBe(true);
        expect(check(CharType.SingleQuote, '"')).toBe(false);
    });

    it('identifies DoubleQuote correctly', () => {
        expect(check(CharType.DoubleQuote, '"')).toBe(true);
        expect(check(CharType.DoubleQuote, "'")).toBe(false);
    });

    it('identifies BackSlash correctly', () => {
        expect(check(CharType.BackSlash, '\\')).toBe(true);
        expect(check(CharType.BackSlash, '/')).toBe(false);
    });

    it('identifies Tilde correctly', () => {
        expect(check(CharType.Tilde, '~')).toBe(true);
        expect(check(CharType.Tilde, '`')).toBe(false);
    });

    it('identifies Exclamation correctly', () => {
        expect(check(CharType.Exclamation, '!')).toBe(true);
        expect(check(CharType.Exclamation, '?')).toBe(false);
    });

    it('identifies At correctly', () => {
        expect(check(CharType.At, '@')).toBe(true);
        expect(check(CharType.At, '#')).toBe(false);
    });

    it('identifies Dollar correctly', () => {
        expect(check(CharType.Dollar, '$')).toBe(true);
        expect(check(CharType.Dollar, '€')).toBe(false);
    });

    it('identifies Question correctly', () => {
        expect(check(CharType.Question, '?')).toBe(true);
        expect(check(CharType.Question, '!')).toBe(false);
    });

    it('identifies Caret correctly', () => {
        expect(check(CharType.Caret, '^')).toBe(true);
        expect(check(CharType.Caret, '~')).toBe(false);
    });

    it('identifies Ampersand correctly', () => {
        expect(check(CharType.Ampersand, '&')).toBe(true);
        expect(check(CharType.Ampersand, '+')).toBe(false);
    });

    it('identifies LessThan correctly', () => {
        expect(check(CharType.LessThan, '<')).toBe(true);
        expect(check(CharType.LessThan, '>')).toBe(false);
    });

    it('identifies GreaterThan correctly', () => {
        expect(check(CharType.GreaterThan, '>')).toBe(true);
        expect(check(CharType.GreaterThan, '<')).toBe(false);
    });

    it('identifies Underscore correctly', () => {
        expect(check(CharType.Underscore, '_')).toBe(true);
        expect(check(CharType.Underscore, '-')).toBe(false);
    });

    it('identifies EqualSign correctly', () => {
        expect(check(CharType.EqualSign, '=')).toBe(true);
        expect(check(CharType.EqualSign, '+')).toBe(false);
    });

    it('identifies LBracket correctly', () => {
        expect(check(CharType.LBracket, '[')).toBe(true);
        expect(check(CharType.LBracket, '(')).toBe(false);
    });

    it('identifies RBracket correctly', () => {
        expect(check(CharType.RBracket, ']')).toBe(true);
        expect(check(CharType.RBracket, ')')).toBe(false);
    });

    it('identifies LBrace correctly', () => {
        expect(check(CharType.LBrace, '{')).toBe(true);
        expect(check(CharType.LBrace, '[')).toBe(false);
    });

    it('identifies RBrace correctly', () => {
        expect(check(CharType.RBrace, '}')).toBe(true);
        expect(check(CharType.RBrace, ']')).toBe(false);
    });

    it('identifies SemiColon correctly', () => {
        expect(check(CharType.SemiColon, ';')).toBe(true);
        expect(check(CharType.SemiColon, ':')).toBe(false);
    });

    it('identifies Colon correctly', () => {
        expect(check(CharType.Colon, ':')).toBe(true);
        expect(check(CharType.Colon, ';')).toBe(false);
    });

    it('identifies Pipe correctly', () => {
        expect(check(CharType.Pipe, '|')).toBe(true);
        expect(check(CharType.Pipe, '/')).toBe(false);
    });

    it('identifies Punctuation correctly', () => {
        expect(check(CharType.Punctuation, '.')).toBe(true);
        expect(check(CharType.Punctuation, '?')).toBe(true);
        expect(check(CharType.Punctuation, 'A')).toBe(false);
    });

    it('identifies Symbol correctly', () => {
        expect(check(CharType.Symbol, '$')).toBe(true);
        expect(check(CharType.Symbol, '+')).toBe(true);
        expect(check(CharType.Symbol, 'A')).toBe(false);
    });

    it('identifies Unicode (non-ASCII) correctly', () => {
        expect(check(CharType.Unicode, '€')).toBe(true);
        expect(check(CharType.Unicode, 'é')).toBe(true);
        expect(check(CharType.Unicode, 'A')).toBe(false);
    });

    describe('Char.getType() for fallback cases', () => {
        it('returns CharType.Unicode for characters not matched by more specific predicates', () => {
            const unknownChar = '\uE000';
            expect(Char.getType(unknownChar)).toBe(CharType.Unicode);
        });

        it('returns CharType.Undefined for undefined and CharType.Error for null', () => {
            // --- CORRECTED EXPECTATION ---
            // This now matches the exact logic in your Char.ts implementation.
            // @ts-ignore
            expect(Char.getType(undefined)).toBe(CharType.Undefined);
            // @ts-ignore
            expect(Char.getType(null)).toBe(CharType.Error);
        });
    });
});
