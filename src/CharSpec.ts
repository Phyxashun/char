// ./src/CharSpec.ts

import { CharType } from './CharType.ts';

type CharSpecFn = (char: string) => boolean;

export const CharSpec: Map<CharType, CharSpecFn> = new Map([
    [CharType.EOF, (char: string) => char === ''],
    //[CharType.NewLine, (char: string) => /[\n\r]/.test(char)],
    [CharType.NewLine, (char: string) => /[\n\r\u2028\u2029]/u.test(char)],
    [CharType.Whitespace, (char: string) => /[ \t\f\v]/.test(char)],

    [CharType.Letter, (char: string) => /\p{L}/v.test(char)],
    [CharType.Number, (char: string) => /\p{N}/v.test(char)],
    [CharType.Emoji, (char: string) => /\p{Emoji}/v.test(char)],
    [CharType.Currency, (char: string) => /\p{Sc}/v.test(char)],

    [CharType.Hash, (char: string) => char === '#'],
    [CharType.Percent, (char: string) => char === '%'],
    [CharType.Slash, (char: string) => char === '/'],
    [CharType.Comma, (char: string) => char === ','],
    [CharType.LParen, (char: string) => char === '('],
    [CharType.RParen, (char: string) => char === ')'],
    [CharType.Plus, (char: string) => char === '+'],
    [CharType.Minus, (char: string) => char === '-'],
    [CharType.Star, (char: string) => char === '*'],
    [CharType.Dot, (char: string) => char === '.'],
    [CharType.Backtick, (char: string) => char === '`'],
    [CharType.SingleQuote, (char: string) => char === "'"],
    [CharType.DoubleQuote, (char: string) => char === '"'],
    [CharType.BackSlash, (char: string) => char === '\\'],
    [CharType.Tilde, (char: string) => char === '~'],
    [CharType.Exclamation, (char: string) => char === '!'],
    [CharType.At, (char: string) => char === '@'],
    [CharType.Dollar, (char: string) => char === '$'],
    [CharType.Question, (char: string) => char === '?'],
    [CharType.Caret, (char: string) => char === '^'],
    [CharType.Ampersand, (char: string) => char === '&'],
    [CharType.LessThan, (char: string) => char === '<'],
    [CharType.GreaterThan, (char: string) => char === '>'],
    [CharType.Underscore, (char: string) => char === '_'],
    [CharType.EqualSign, (char: string) => char === '='],
    [CharType.LBracket, (char: string) => char === '['],
    [CharType.RBracket, (char: string) => char === ']'],
    [CharType.LBrace, (char: string) => char === '{'],
    [CharType.RBrace, (char: string) => char === '}'],
    [CharType.SemiColon, (char: string) => char === ';'],
    [CharType.Colon, (char: string) => char === ':'],
    [CharType.Pipe, (char: string) => char === '|'],

    [CharType.Punctuation, (char: string) => /\p{P}/v.test(char)],

    [CharType.Symbol, (char: string) => /\p{S}/v.test(char)],

    [CharType.Unicode, (char: string) => /\P{ASCII}/v.test(char)],
]);
