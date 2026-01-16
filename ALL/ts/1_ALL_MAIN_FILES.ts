

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./src/Char.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./src/Char.ts

import { inspect, type InspectOptions } from 'node:util';
import { CharType } from './CharType.ts';
import { CharSpec } from './CharSpec.ts';

/*
interface InspectOptions {
	// The length at which input values are split across multiple lines. Set to Infinity to format the input as a single line (in combination with compact set to true or any number >= 1).
	breakLength?: number;

	// If true, the output is styled with ANSI color codes. Colors are customizable.
	colors?: boolean;

	// Setting this to false causes each object key to be displayed on a new line. It will also add new lines to text that is longer than breakLength. If set to a number, the most n inner elements are united on a single line as long as all properties fit into breakLength. Short array elements are also grouped together. Note that no text will be reduced below 16 characters, no matter the breakLength size. For more information, see the example below.
	compact?: number | boolean;

	// If false, [util.inspect.custom](depth, opts, inspect) functions are not invoked.
	customInspect?: boolean;
    
	// Specifies the number of times to recurse while formatting object. This is useful for inspecting large objects. To recurse up to the maximum call stack size pass Infinity or null.
	depth?: null | number;
    
	// If set to true, getters are going to be inspected as well. If set to 'get' only getters without setter are going to be inspected. If set to 'set' only getters having a corresponding setter are going to be inspected. This might cause side effects depending on the getter function.
	getters?: boolean | 'get' | 'set';
    
	// Specifies the maximum number of Array, TypedArray, WeakMap, and WeakSet elements to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no elements.
	maxArrayLength?: null | number;
    
	// Specifies the maximum number of characters to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no characters.
	maxStringLength?: null | number;
    
	// If set to true, an underscore is used to separate every three digits in all bigints and numbers.
	numericSeparator?: boolean;
    
	// If true, object's non-enumerable symbols and properties are included in the formatted result. WeakMap and WeakSet entries are also included as well as user defined prototype properties (excluding method properties).
	showHidden?: boolean;
    
	// If true, Proxy inspection includes the target and handler objects.
	showProxy?: boolean;
    
	// If set to true or a function, all properties of an object, and Set and Map entries are sorted in the resulting string. If set to true the default sort is used. If set to a function, it is used as a compare function.
	sorted?: boolean | ((a: string, b: string) => number);
}//*/

/**
 * Constants
 */
const TARGET_CHAR_DISPLAY_WIDTH = 8;
const IS_UNDEFINED = -1;
const IS_NULL = 0;
const SINGLE_WIDTH = 1;
const DOUBLE_WIDTH = 2;
const COMMON_ESCAPES: Record<string, string> = {
    '\n': '\\n',
    '\r': '\\r',
    '\r\n': '\\r\\n', // Standard CRLF segment
    '\t': '\\t',
    '\v': '\\v',
    '\f': '\\f',
    '\0': '\\0',
    '\\': '\\\\',
} as const;
const NUMERAL_MAP: Record<string, number> = {
    Ⅰ: 1,
    Ⅱ: 2,
    Ⅲ: 3,
    Ⅳ: 4,
    Ⅴ: 5,
    Ⅵ: 6,
    Ⅶ: 7,
    Ⅷ: 8,
    Ⅸ: 9,
    Ⅹ: 10,
    Ⅺ: 11,
    Ⅻ: 12,
    Ⅼ: 50,
    Ⅽ: 100,
    Ⅾ: 500,
    Ⅿ: 1000,
    // Add other numeral systems here
    '①': 1,
    '②': 2,
    '③': 3,
    '④': 4,
    '⑤': 5,
    '⑥': 6,
    '⑦': 7,
    '⑧': 8,
    '⑨': 9,
    '⑩': 10,
} as const;

/**
 * @class Position
 * @description - A class representing the position of a sub-object within another object
 * @property {number} index  - The zero-based index of the character within the source object.
 * @property {number} line   - The line number of the character within the source object.
 * @property {number} column - The column number of the character within the source object.
 */
export class Position {
    constructor(
        public index: number = IS_UNDEFINED,
        public line: number = IS_UNDEFINED,
        public column: number = IS_UNDEFINED,
    ) {}
}

export class IChar {
    public type: CharType;
    // Use Uint32Array to safely store full 21-bit Unicode code points
    protected _value: Uint32Array;
    protected _isSubstring: boolean;
    public maxWidth: number;
    public position: Position;

    constructor(type?: CharType, value?: string, isSubstring?: boolean, position?: Position) {
        this.type = type ?? CharType.Undefined;
        this._value = new Uint32Array(0);
        this.value = value ?? ' ';
        this._isSubstring = isSubstring ?? false;
        this.maxWidth = 0;
        this.position = position ? position : new Position();
    }

    public get isSubstring(): boolean {
        return this._isSubstring && this.position && this.position.index !== IS_UNDEFINED;
    }

    public set isSubstring(value: boolean) {
        this._isSubstring = value;
    }

    public get value(): string {
        // Convert code points to strings one-by-one to avoid
        // stack overflow limits caused by the spread operator (...)
        return Array.from(this._value)
            .map(codePoint => String.fromCodePoint(codePoint))
            .join('');
    }

    public set value(character: string) {
        // Use Array.from to correctly extract full code points (not UTF-16 units)
        const codePoints = Array.from(character).map(c => c.codePointAt(0)!);

        // Validate that nothing stored is outside the valid Unicode range
        if (codePoints.some(cp => cp > 0x10ffff)) {
            throw new Error('Invalid Unicode code point detected.');
        }

        this._value = new Uint32Array(codePoints);
    }
}

/**
 * @class Char
 * @extends String
 * @description A class representing a single character, extending the native String class.
 * It provides additional properties for context when it's part of a larger string,
 * and methods similar to Java's Character wrapper class.
 * @property {boolean} isSubstring - A boolean indicating if the character is part of a larger string.
 * @property {Position} Position   - The position of a char within the source string.
 */
export class Char extends IChar {
    private readonly raw: string;

    /**
     * Creates an instance of a Char.
     * @param value The single character string.
     * @param options Contextual information if the character is from a larger string.
     */
    constructor(
        character: string,
        options: {
            isSubstring?: boolean;
            position?: Position;
        } = {},
    ) {
        // Unicode-safe validation using Intl.Segmenter
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = Array.from(segmenter.segment(character));

        if (segments.length !== 1) {
            throw new Error('Input must be a single visual character (grapheme).');
        }

        const isSubstring = options.isSubstring ?? false;
        const position = options.position;

        // Use the actual segment value for consistency
        const validatedChar = segments[0]!.segment;

        super(Char.getType(validatedChar), validatedChar, isSubstring, position);
        this.raw = validatedChar;
    }

    public override toString(): string {
        const value = Char.handleEscape(this.value);

        // If handleEscape already returned an escaped representation (like '\\n'),
        // we can return it directly. Otherwise, check for other control characters.
        if (value !== this.value) return value;

        // Check for other unprintable or special Unicode characters
        // Using \p{Control} and \p{Unassigned} to identify characters that should be escaped
        if (/\p{Control}/u.test(value)) {
            return Array.from(value)
                .map(cp => {
                    const code = cp.codePointAt(0);
                    if (code === undefined) return '';
                    return `\\u{${code.toString(16).toUpperCase()}}`;
                })
                .join('');
        }

        // Return the character as-is if it's a standard printable character
        return value;
    }

    public getRawString(): string {
        return this.raw;
    }

    public get [Symbol.toStringTag](): string {
        return 'Char';
    }

    /**
     * Custom inspector for util.inspect.
     * @param depth The current recursion depth.
     * @param options The inspection options, which *now* correctly contains `stylize`.
     * @param inspectFn The util.inspect function itself (useful for recursive calls).
     */
    [inspect.custom] = (depth: number, options: InspectOptions, inspectFn: Function): string => {
        // Get the private stylize function from node:util.inspect
        const stylize = (options as any).stylize;

        // If recursion depth is exhausted, show a placeholder.
        if (depth < 0) return stylize(`[Char]`, 'special');

        // Get the class name and stylize it.
        const CLASSNAME = stylize(this.constructor.name, 'special');

        // The character string to be displayed, including escapes for things like newlines.
        const charString = this.toString();

        // Calculate the visual width of the character.
        const visualWidth = Char.calculateVisualWidth(this.value);

        // The total width of the content inside the padding, including the quotes
        // +2 for the single quotes
        const contentWidth = visualWidth + 2;

        // Define a target total visual width for this section of the output. Let's use 8 for good spacing.
        const targetWidth = TARGET_CHAR_DISPLAY_WIDTH;

        // Calculate how many spaces are needed for padding based on visual width.
        // We subtract the width of the (character + 2) for the single quotes.
        const totalPadding = Math.max(0, targetWidth - contentWidth);
        const paddingStart = Math.floor(totalPadding / 2);
        const paddingEnd = Math.ceil(totalPadding / 2);

        // Construct the final padded string.
        const charPadded = ' '.repeat(paddingStart) + `'${charString}'` + ' '.repeat(paddingEnd);
        const CHAR = stylize(charPadded, 'date');

        // Handle the position info if it exists.
        let IDX = '',
            POS = '';
        if (this.isSubstring) {
            // Stylize the index, line and column numbers.
            const idxPadStart = `${this.position.index}`.padStart(2, ' ');
            const linPadStart = `${this.position.line}`.padStart(2, ' ');
            const colPadStart = `${this.position.column}`.padStart(2, ' ');
            const linColInfo = `[ ${linPadStart} : ${colPadStart} ]`;
            const posInfo = stylize(linColInfo, 'number');
            IDX = stylize(`[${idxPadStart}]`, 'number');
            POS = `, pos: ${posInfo}`;
        }

        // Get the type and stylize it.
        const typeChar = this.type;
        const typePadEnd = typeChar.padEnd(11, ' ');
        const typeInfo = stylize(typePadEnd, 'string');
        const charType = stylize(`CharType.`, 'special');
        const TYPE = `type: ${charType}${typeInfo}${POS}`;

        // Combine everything into the final string.
        return `${CLASSNAME}${IDX}: ${CHAR}: { ${TYPE} }`;
    };

    // --- Character Analysis Methods ---

    public isEOF(): boolean {
        return this.type === CharType.EOF;
    }

    public isNumber(): boolean {
        return this.type === CharType.Number;
    }

    public isLetter(): boolean {
        return this.type === CharType.Letter;
    }

    public isLetterOrNumber(): boolean {
        // Matches any letter or number in any script
        return this.isLetter() || this.isNumber();
    }

    public isNewLine(): boolean {
        return this.type === CharType.NewLine;
    }

    public isWhitespace(): boolean {
        return this.type === CharType.Whitespace;
    }

    public isEmoji(): boolean {
        return this.type === CharType.Emoji;
    }

    public isCurrency(): boolean {
        return this.type === CharType.Currency;
    }

    public isPunctuation(): boolean {
        return this.type === CharType.Punctuation;
    }

    public isSymbol(): boolean {
        return this.type === CharType.Symbol;
    }

    public isUnicode(): boolean {
        return this.type === CharType.Unicode;
    }

    public isUndefined(): boolean {
        return this.type === CharType.Undefined;
    }

    public isUpperCase(): boolean {
        // \p{Lu} = Unicode Uppercase Letter
        return /\p{Lu}/u.test(this.value);
    }

    public isLowerCase(): boolean {
        // \p{Ll} = Unicode Lowercase Letter
        return /\p{Ll}/u.test(this.value);
    }

    public getNumericValue(): number {
        const val = this.value;

        // Check if the value is a non-digit value
        const nonDigit = Char.handleNonDigit(val);
        if (nonDigit !== IS_UNDEFINED) return nonDigit;

        // Normalize the string. NFKD compatibility decomposition is a good choice.
        const normalizedVal = val.normalize('NFKD');

        // Use a regex to filter for standard digits after normalization
        const digits = normalizedVal.replace(/[^0-9]/g, '');

        // Basic check for standard digits 0-9
        if (digits) return parseInt(digits, 10);

        // For other Unicode numbers, you might return the code point
        // or use a library to get the actual decimal value
        return IS_UNDEFINED;
    }

    public getValue(): Uint32Array {
        return this._value;
    }

    // --- Static Factory ---

    /**
     * Creates an array of Char objects from a string, calculating the position
     * (index, line, column) of each character.
     * @param {string} str The source string.
     * @returns {Char[]} An array of Char objects.
     */
    public static fromString = (str: string): Char[] => {
        const chars: Char[] = [];
        let maxWidth: number = 0;

        // 1. First, determine the final maxWidth (longest line)
        const lines = str.split(/\r?\n/);
        for (const line of lines) {
            const currentLineWidth = Char.calculateVisualWidth(line);
            if (currentLineWidth > maxWidth) maxWidth = currentLineWidth;
        }

        // 2. Iterate over graphemes and build the initial array
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = segmenter.segment(str);

        for (const { segment, index } of segments) {
            const position = Char.calculatePosition(str, index);

            chars.push(
                new Char(segment, {
                    isSubstring: true,
                    position: position,
                }),
            );
        }

        // 3. Final Step: Assign the computed maxWidth to every character object
        // This ensures all instances reference the same global maximum
        for (const c of chars) {
            c.maxWidth = maxWidth;
        }

        return chars;
    };

    /**
     * Calculates the line and column number for a character at a specific index within a string.
     *
     * @param text The full source string.
     * @param index The zero-based index of the character to locate.
     * @returns A Position object with the index, line, and column.
     */
    public static calculatePosition = (text: string, targetIndex: number): Position => {
        let line = 1;
        let column = 1;

        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = segmenter.segment(text);

        for (const { segment, index } of segments) {
            if (index >= targetIndex) break;

            // Correctly handle different line break types (e.g., \n or CRLF)
            if (segment === '\n' || segment === '\r\n' || segment === '\r') {
                line++;
                column = 1;
            } else {
                column++;
            }
        }

        return new Position(targetIndex, line, column);
    };

    /**
     * Calculates the visual width of a string in a monospace terminal.
     * This is a heuristic and may not be perfect for all characters or terminals.
     * @param str The string to measure.
     * @returns The visual width (typically 1 or 2 for most characters).
     */
    public static calculateVisualWidth(str: string): number {
        // Handle specific multi-character escape representations first
        const escaped = Char.handleEscape(str);
        if (escaped !== str) return escaped.length;

        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = Array.from(segmenter.segment(str));
        if (segments.length === 0) return IS_NULL;
        const char = segments[0]!.segment;

        // If the grapheme contains \uFE0F, it's being forced to 2-column emoji presentation.
        if (char.includes('\uFE0F')) return DOUBLE_WIDTH;

        // This correctly identifies graphemes like '⚔️' and '🎖️' as width 2.
        if (/\p{Emoji_Presentation}/v.test(char)) return DOUBLE_WIDTH;

        // Fallback for other non-emoji wide characters (like CJK)
        const codePoint = char.codePointAt(0);

        // If any part of the grapheme is in the double-width list, the whole thing is double-width.
        if (codePoint && this.isDoubleWidth(codePoint)) return DOUBLE_WIDTH;

        // If no double-width, non-zero-width characters, it must be single-width.
        return SINGLE_WIDTH;
    }

    public static isMultiCharacter(str: string): boolean {
        return str === '\\n' || str === '\\t' || str === '\\r' || str === '\\v' || str === '\\f';
    }

    public static isZeroWidth(code: number): boolean {
        return (
            code <= 0x1f || // C0 controls
            (code >= 0x7f && code <= 0x9f) || // C1 controls
            (code >= 0x300 && code <= 0x36f) || // Combining Diacritical Marks
            (code >= 0x200b && code <= 0x200f) || // Zero-width spaces
            (code >= 0xfe00 && code <= 0xfe0f) || // Variation Selectors block
            (code >= 0xfeff && code <= 0xfeff)
        ); // Zero-width no-break space
    }

    public static isDoubleWidth(code: number): boolean {
        // This list is a heuristic. The Emoji_Presentation check in calculateVisualWidth is more robust for emojis.
        // This is primarily for full-width forms and CJK characters.
        return (
            (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
            (code >= 0x2329 && code <= 0x232a) || // Left/Right Angle Bracket
            (code >= 0x3040 && code <= 0x309f) || // Hiragana
            (code >= 0x30a0 && code <= 0x30ff) || // Katakana
            (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
            (code >= 0xac00 && code <= 0xd7a3) || // Hangul Syllables
            (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
            (code >= 0xfe10 && code <= 0xfe19) || // Vertical Forms
            (code >= 0xfe30 && code <= 0xfe6f) || // CJK Compatibility Forms
            (code >= 0xff00 && code <= 0xffef) || // Halfwidth and Fullwidth Forms
            code >= 0x1f300
        ); // Most modern Emoji and Symbols
    }

    /**
     * @method getType
     * @description
     * @param char
     * @returns
     */
    public static getType = (char: string): CharType => {
        if (char === undefined) return CharType.Undefined;
        if (char === null) return CharType.Error;

        for (const [type, predicate] of CharSpec) {
            if (predicate(char)) return type;
        }
        return CharType.Undefined;
    };

    public static handleEscape(value: any): string {
        // Handle common single-character escapes
        if (COMMON_ESCAPES[value]) return COMMON_ESCAPES[value];

        return value;
    }

    public static handleNonDigit(value: any): number {
        // Check if the value is in the numeral map.
        if (NUMERAL_MAP[value] !== undefined) {
            return NUMERAL_MAP[value];
        }

        return IS_UNDEFINED;
    }
}





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./src/Char.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./src/CharType.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./src/CharType.ts

// Σ (Sigma) - the set of allowed characters
export enum CharType {
    // CharacterStream Control
    EOF = 'EOF',
    Error = 'Error',
    Other = 'Other',
    Undefined = 'Undefined',

    // Whitespace & Formatting
    Whitespace = 'Whitespace',
    NewLine = 'NewLine',

    // Primary Literals
    Letter = 'Letter',
    Number = 'Number',
    Hex = 'Hex',

    // Quotes & Strings
    SingleQuote = 'SingleQuote',
    DoubleQuote = 'DoubleQuote',
    Backtick = 'Backtick',

    // Brackets & Enclosures
    LParen = 'LParen',
    RParen = 'RParen',
    LBracket = 'LBracket',
    RBracket = 'RBracket',
    LBrace = 'LBrace',
    RBrace = 'RBrace',

    // Common Operators & Mathematical
    Plus = 'Plus',
    Minus = 'Minus',
    Star = 'Star',
    Slash = 'Slash',
    BackSlash = 'BackSlash',
    EqualSign = 'EqualSign',
    Percent = 'Percent',
    Caret = 'Caret',
    Tilde = 'Tilde',
    Pipe = 'Pipe',
    LessThan = 'LessThan',
    GreaterThan = 'GreaterThan',

    // Punctuation & Delimiters
    Dot = 'Dot',
    Comma = 'Comma',
    Colon = 'Colon',
    SemiColon = 'SemiColon',
    Exclamation = 'Exclamation',
    Question = 'Question',
    Punctuation = 'Punctuation',

    // Special Symbols & Identifiers
    Hash = 'Hash',
    At = 'At',
    Ampersand = 'Ampersand',
    Dollar = 'Dollar',
    Underscore = 'Underscore',
    Currency = 'Currency',
    Symbol = 'Symbol',

    // International / Multi-byte
    Emoji = 'Emoji',
    Unicode = 'Unicode',
}





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./src/CharType.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./src/CharSpec.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




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





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./src/CharSpec.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./index.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./src/index.ts

import { Char } from './src/Char.ts';
import { styleText, inspect, promisify } from 'node:util';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Enumerations

/**
 * Defines the available test identifiers.
 * Using an enum provides clear, readable names for the tests.
 */
enum Test {
    one = 1,
    two = 2,
    three = 3,
    four = 4,
    five = 5,
}

// Types
interface RunContext {
    msg?: string;
    str?: string;
    ltr?: string;
    tests?: number[];
}

/**
 * The context object passed to each test function, containing the
 * string to be tested and an optional letter.
 * @property str The primary string input for the test.
 * @property ltr An optional secondary character or string for tests that require it (e.g., searching).
 */
interface TestContext {
    msg: string;
    str: string;
    ltr?: string;
}

/**
 * Defines the structure for a test case definition.
 * It specifies the input strings and which test(s) to run.
 * @property str The primary string input for the test.
 * @property ltr An optional secondary character or string.
 * @property tests A single TestDefNumber or an array of TestDefNumbers to execute.
 */
interface TestSchemasContext {
    msg: string;
    str: string;
    ltr?: string;
    tests: number | number[];
}

/**
 * A function that executes a specific test scenario.
 */
type TestDefinition = (ctx: TestContext) => void;

type ParseTestSchemaNumberOutput = number[] | undefined;

//Utility Functions

/**
 * A collection of helper functions for logging and formatting output.
 */
const util = {
    /** Configuration options for node's `inspect` utility. */
    inspectOptions: {
        showHidden: false,
        depth: null,
        colors: true,
        customInspect: true,
        showProxy: false,
        maxArrayLength: null,
        maxStringLength: null,
        breakLength: 180,
        compact: true,
        sorted: false,
        getters: false,
        numericSeparator: true,
    },
    /** Prints a new line to the console. */
    insertReturn: (): void => {
        console.log('\r');
    },
    /** Displays a styled title on the console. */
    insertTitle: (data: any): void => {
        console.log(styleText(['red', 'bold'], data));
    },
    /** Returns a stylized string for console output. */
    style: (data: any): string => {
        return styleText(['blue', 'bold'], data);
    },
    /** Returns a string representation of an object, formatted for inspection. */
    inspect: (data: any): string => {
        return inspect(data, util.inspectOptions);
    },
    /**
     * Outputs a deeply inspected object to the console with proper color formatting.
     * This fixes an issue where escape codes might be double-escaped.
     */
    deepLog: (data: any): void => {
        const output = inspect(data, util.inspectOptions);
        // This regex handles both the standard \u001b and the
        // way inspect sometimes formats them as \x1B
        console.log(output.replace(/\\u001b|\\x1b/gi, '\x1b'));
    },
    /** Executes a set of tests based on a test definition context. */
    execute: (testSchCtx: TestSchemasContext): void => {
        const { msg, str, ltr, tests }: TestSchemasContext = testSchCtx;
        const testCtx: TestContext = { msg, str, ltr };
        if (Array.isArray(tests)) {
            tests.forEach(num => Tests[num]!(testCtx));
        } else {
            Tests[tests]!(testCtx);
        }
    },
};

/**
 * A map of test implementations, where each key is a `TestDefNumber`
 * and the value is the corresponding test function.
 */
const Tests: Record<number, TestDefinition> = {
    /**
     * Test 1: Creates a Char from a single character and outputs its raw,
     * character, and stored value representations.
     */
    [Test.one]: ({ msg, str }: TestContext): void => {
        if (str.length === 0 || str.length > 1) return;
        console.log(`\n--- Running ${msg}-1 ---`);
        const char = new Char(str);
        util.insertTitle('CHARACTER TEST:');
        const raw = `${str}`;
        console.log(`raw:\tRaw String:\t${util.style(raw)}`);
        const charStr = `${char}`;
        console.log(`char:\tCharacter:\t${util.style(charStr)}`);
        const numAsStr = `${char.getValue()}`;
        console.log(`char:\tStored Value:\t${util.style(numAsStr)}`);
        util.insertReturn();
    },

    /**
     * Test 2: Creates a Char and displays its numeric value,
     * which is useful for non-digit characters.
     */
    [Test.two]: ({ msg, str }: TestContext): void => {
        if (str.length === 0 || str.length > 1) return;
        console.log(`\n--- Running ${msg}-2 ---`);
        const char = new Char(str);
        util.insertTitle('NON-DIGIT CHARACTER TEST:');
        const raw = `${str}`;
        console.log(`raw:\tRaw String:\t${util.style(raw)}`);
        const charStr = `${char}`;
        console.log(`char:\tCharacter:\t${util.style(charStr)}`);
        const numAsStr = `${char.getValue()}`;
        console.log(`char:\tStored Value:\t${util.style(numAsStr)}`);
        const numericAsStr = `${char.getNumericValue()}`;
        console.log(`char:\tNumeric Value:\t${util.style(numericAsStr)}`);
        util.insertReturn();
    },

    /**
     * Test 3: Finds a specific character within a string and displays its
     * properties, such as value, case, and position.
     */
    [Test.three]: ({ msg, str, ltr }: TestContext): void => {
        if (!ltr) return;
        console.log(`\n--- Running ${msg}-3 ---`);
        const chars = Char.fromString(str);

        // Normalize both strings to a standard form (e.g., 'NFC' is common)

        // Ensure 'ltr' is a single grapheme cluster if intended
        const normalizedLtr = ltr.normalize('NFC');
        const ch = chars.find(char => {
            // Normalize the character from the array as well before comparison
            return char.value.normalize('NFC') === normalizedLtr;
        });

        if (ch) {
            util.insertTitle('FIND CHARACTER TEST:');
            console.log(`--- Found the character '${ltr}' ---`);
            console.log(`Value: ${ch.value}`);
            console.log(`Is it uppercase? ${ch.isUpperCase()}`);
            if (ch.position) {
                console.log(`Index in string: ${ch.position.index}`);
                console.log(`Line number: ${ch.position.line}`);
                console.log(`Column number: ${ch.position.column}`);
            }
        }
        util.insertReturn();
    },

    /**
     * Test 4: Iterates over a string to find and report the
     * position of whitespace and newline characters.
     */
    [Test.four]: ({ msg, str }: TestContext): void => {
        const chars = Char.fromString(str);
        console.log(`\n--- Running ${msg}-4 ---`);
        util.insertTitle('ITERATE TEST:');

        chars.forEach(ch => {
            const val = ch.value;
            const pos = ch.position;

            if (pos) {
                // Unicode-safe Whitespace Check
                // Matches any character with the "White_Space" property (spaces, tabs, etc.)
                const isWhitespace = /\p{White_Space}/u.test(val);

                // Unicode-safe insertReturn Check
                // Specific check for line terminators (\n, \r, U+2028 Line Separator, U+2029 Paragraph Separator)
                const isinsertReturn = /[\n\r\u2028\u2029]/.test(val) || val === '\u0085';
                if (isWhitespace) {
                    console.log(`Found a whitespace character at line ${pos.line}, column ${pos.column}`);
                }

                if (isinsertReturn) {
                    console.log(`Found a insertReturn character at line ${pos.line}, column ${pos.column}`);
                }
            }
        });
        util.insertReturn();
    },

    /**
     * Test 5: Demonstrates iterating over the `Char[]` array using a
     * for...of loop and inspecting each character.
     */
    [Test.five]: ({ msg, str }: TestContext): void => {
        console.log(`\n--- Running ${msg}-5 ---`);
        const chars = Char.fromString(str);
        util.insertTitle('FOR OF TEST:');
        for (const ch of chars) {
            console.log(util.inspect(ch));
        }
        util.insertReturn();
    },
};

/**
 * A map of test definitions, where each key is a `TestDefNumber` and the value
 * is a `TestSchemasContext` object describing the test case.
 */
const TestSchemas: Record<number, TestSchemasContext> = {
    [1]: { msg: 'Test A', str: 'A', tests: [1, 2] },
    [2]: { msg: 'Test B', str: '🪖', tests: [1, 2] },
    [3]: { msg: 'Test C', str: `Hello, World!\nThis is line 2.`, ltr: 'W', tests: [3, 4, 5] },
    [4]: { msg: 'Test D', str: `🪖⚔️🎖️🪖🎖️💪`, ltr: '⚔️', tests: [3, 4, 5] },
    [5]: { msg: 'Test E', str: 'rgba(100, 250, 255, 0.5)', tests: [4, 5] },
};

/**
 * The main test dispatcher.
 * If called with no context, it runs all predefined tests.
 * If called with user input, it finds the corresponding test definition and runs it.
 */
const run = (ctx: RunContext) => {
    const { str, ltr, tests } = ctx;
    if (!str && !ltr && !tests) {
        for (const testSchema of Object.values(TestSchemas)) {
            util.execute(testSchema);
        }
        return;
    }

    if (tests) {
        tests.forEach(num => {
            ctx.msg = `Custom Test ${num}`;
            inspect(this, util.inspectOptions);
            util.execute(ctx as TestSchemasContext);
        });
    }
};

const parseInput = (value: string): ParseTestSchemaNumberOutput => {
    const trimmedValue = value.trim();
    if (trimmedValue === '') return undefined;
    if (trimmedValue.includes(',')) {
        return trimmedValue
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number);
    }
    const num = Number(trimmedValue);
    return isNaN(num) ? undefined : [num];
};

const showAvailableTests = (): void => {
    const availableTests = styleText(['cyan'], `Available test schemas: ${Object.keys(TestSchemas).join(', ')}`);
    console.log(availableTests, '\n');
};

/**
 * Prompts the user for input and returns the response as a Promise.
 * @param promptText The text to display to the user.
 * @returns A Promise that resolves with the user's input string.
 */
async function getInput(promptText: string): Promise<string> {
    const rl = readline.createInterface({ input, output });
    try {
        const answer = await rl.question(promptText);
        return answer;
    } catch (e) {
        console.error('An error occurred:', e);
    } finally {
        rl.close();
    }
    return '';
}

async function getStringInput(): Promise<string> {
    const strQuestion = 'Enter a custom string to test (or press Enter to use predefined strings): ';
    const strInputString = await getInput(strQuestion);
    console.log('');
    return strInputString.trim() !== '' ? strInputString : '';
}

async function getTestSchNumbers(): Promise<ParseTestSchemaNumberOutput> {
    const TestSchNumberQuestion = 'Enter a test schema number or a comma-separated list (or press Enter to run all): ';
    const TestSchNumberString = await getInput(TestSchNumberQuestion);
    console.log('');
    return parseInput(TestSchNumberString);
}

async function getLetterInput(): Promise<string> {
    const ltrQuestion = styleText('yellow', 'One or more selected tests can use an "ltr" value. Enter character to find: ');
    const ltrInput = await getInput(ltrQuestion);
    console.log('');
    return ltrInput.trim() !== '' ? ltrInput : '';
}

async function main() {
    const testsThatRequireChar = [1, 2];
    const testsThatRequireLtr = [3];
    let strInput: string | undefined = undefined;
    let TestSchNumberInput: number[] | undefined = undefined;
    let ltrInput: string | undefined = undefined;

    console.log('\n');

    showAvailableTests();

    // Get user input for string value
    strInput = await getStringInput();
    const isString = strInput.length > 1 ? true : false;

    // Get user input for test numbers to execute
    TestSchNumberInput = await getTestSchNumbers();
    if (TestSchNumberInput === undefined && isString) TestSchNumberInput = [3, 4, 5];

    // Check is ant of the selected tests can only accept a single character string
    const requiresChar = TestSchNumberInput?.some(num => testsThatRequireChar.includes(num));

    if (requiresChar && isString) {
        console.log('Cannot execute the selected tests with a string, must be a single character.');
        return;
    }

    // Check if any of the selected tests require a letter
    const requiresLtr = TestSchNumberInput?.some(num => testsThatRequireLtr.includes(num));

    // If needed get user input for letter to find
    if (requiresLtr && isString) ltrInput = await getLetterInput();

    const ctx: RunContext = {
        str: strInput,
        ltr: ltrInput,
        tests: TestSchNumberInput,
    };

    run(ctx);
}

// Run the main function to start the tests.
main();





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./index.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████
