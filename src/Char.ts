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
    '\\': '\\\\'
} as const;
const NUMERAL_MAP: Record<string, number> = {
    'Ⅰ': 1, 'Ⅱ': 2, 'Ⅲ': 3, 'Ⅳ': 4, 'Ⅴ': 5,
    'Ⅵ': 6, 'Ⅶ': 7, 'Ⅷ': 8, 'Ⅸ': 9, 'Ⅹ': 10,
    'Ⅺ': 11, 'Ⅻ': 12, 'Ⅼ': 50, 'Ⅽ': 100, 'Ⅾ': 500,
    'Ⅿ': 1000,
    // Add other numeral systems here
    '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
    '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10,
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
    ) { }
}

export class IChar {
    public type: CharType;
    // Use Uint32Array to safely store full 21-bit Unicode code points
    protected _value: Uint32Array;
    protected _isSubstring: boolean;
    public position: Position;

    constructor(type?: CharType, value?: string, isSubstring?: boolean, position?: Position) {
        this.type = type ?? CharType.Undefined;
        this._value = new Uint32Array(0);
        this.value = value ?? ' ';
        this._isSubstring = isSubstring ?? false;
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
        if (codePoints.some(cp => cp > 0x10FFFF)) {
            throw new Error("Invalid Unicode code point detected.");
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
    public static DEBUG_INFO: any[] = [];

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
        } = {}
    ) {
        // Unicode-safe validation using Intl.Segmenter
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = Array.from(segmenter.segment(character));

        if (segments.length !== 1) {
            throw new Error("Input must be a single visual character (grapheme).");
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
        const visualWidth = Char.getVisualWidth(charString);

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
        let IDX = '', POS = '';
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
        const result = `${CLASSNAME}${IDX}: ${CHAR}: { ${TYPE} }`;
        const resultObj = {
            [`${result}`]: {
                result: result,
                visualWidth: visualWidth,
                contentWidth: contentWidth,
                paddingStart: paddingStart,
                paddingEnd: paddingEnd,
            }
        };
        Char.log({ resultObj });

        return result;
    };

    /**
     * Logs the name and value of the first property in the passed object.
     * To use, pass an object with the variable as the key using shorthand.
     * @example
     * const myVar = 123;
     * logger.log({ myVar }); // Logs "myVar = 123"
     */
    public static log(obj: { [key: string]: any; }): void {
        // Get the name of the first variable (key) in the object.
        const variableName = Object.keys(obj)[0];

        if (variableName) {
            // Get the corresponding value.
            const value = obj[variableName];
            const output = `${variableName} = ${value}`;
            console.log(JSON.stringify(output, null, 2));

            // Store the original object
            this.DEBUG_INFO.push(obj);
        }
    }

    // --- Character Analysis Methods ---

    public isEOF(): boolean {
        return this.value === '';
    }

    public isNumber(): boolean {
        // \p{N} matches any kind of numeric character in any script
        return /\p{N}/u.test(this.value);
    }

    public isLetter(): boolean {
        // \p{L} matches any letter from any language
        return /\p{L}/u.test(this.value);
    }

    public isLetterOrNumber(): boolean {
        // Matches any letter or number in any script
        return this.isLetter() || this.isNumber();
    }

    public isNewLine(): boolean {
        // Matches new line characters
        return /[\n\r\u2028\u2029]/u.test(this.value);
    }

    public isWhitespace(): boolean {
        // \p{White_Space} includes all Unicode spaces, tabs, and line breaks
        return /\p{White_Space}/u.test(this.value);
    }

    public isEmoji(): boolean {
        // \p{Emoji_Presentation} is the safest way to detect visual emojis
        return /\p{Emoji_Presentation}/u.test(this.value);
    }

    public isCurrency(): boolean {
        // \p{Sc} matches any currency symbol ($, €, ¥, ₿, etc.)
        return /\p{Sc}/u.test(this.value);
    }

    public isPunctuation(): boolean {
        // Matches any punctuation symbol in any script
        return /\p{P}/u.test(this.value);
    }

    public isSymbol(): boolean {
        // Matches any symbol in any script
        return /\p{S}/u.test(this.value);
    }

    public isUnicode(): boolean {
        // Matches any non-ASCII character
        return /[^\x00-\x7F]/g.test(this.value);
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

        // Use Intl.Segmenter to iterate over graphemes (visual characters)
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = segmenter.segment(str);

        for (const { segment, index } of segments) {
            // Call the Unicode-safe calculatePosition for the current byte index
            // This ensures the line/column logic is consistent across both methods
            const position = Char.calculatePosition(str, index);

            chars.push(new Char(segment, {
                isSubstring: true,
                position: position
            }));
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
    public static getVisualWidth(str: string): number {
        // Handle specific multi-character escape representations first
        if (Char.handleEscape(str)) return DOUBLE_WIDTH;

        // The most reliable way to check for emojis is the Emoji_Presentation property.
        // This correctly identifies graphemes like '⚔️' and '🎖️' as width 2.
        if (/\p{Emoji}/u.test(str)) return DOUBLE_WIDTH;

        // Fallback for other non-emoji wide characters (like CJK)
        for (const char of str) {
            const code = char.codePointAt(0);

            // Skip control characters and zero-width components
            if (!code || this.isZeroWidth(code)) continue;

            // If any part of the grapheme is in the double-width list, the whole thing is double-width.
            if (this.isDoubleWidth(code)) return DOUBLE_WIDTH;
        }

        // If no double-width, non-zero-width characters, it must be single-width.
        return (str.length > 0) ? SINGLE_WIDTH : IS_NULL;
    }

    public static isMultiCharacter(str: string): boolean {
        return str === '\\n' ||
            str === '\\t' ||
            str === '\\r' ||
            str === '\\v' ||
            str === '\\f';
    }

    public static isZeroWidth(code: number): boolean {
        return (code <= 0x1F) ||                    // C0 controls
            (code >= 0x7F && code <= 0x9F) ||       // C1 controls
            (code >= 0x300 && code <= 0x36F) ||     // Combining Diacritical Marks
            (code >= 0x200B && code <= 0x200F) ||   // Zero-width spaces
            (code >= 0xFE00 && code <= 0xFE0F) ||   // Variation Selectors block
            (code >= 0xFEFF && code <= 0xFEFF);     // Zero-width no-break space
    }

    public static isDoubleWidth(code: number): boolean {
        // This list is a heuristic. The Emoji_Presentation check in getVisualWidth is more robust for emojis.
        // This is primarily for full-width forms and CJK characters.
        return (code >= 0x1100 && code <= 0x115F) ||    // Hangul Jamo
            (code >= 0x2329 && code <= 0x232A) ||       // Left/Right Angle Bracket
            (code >= 0x3040 && code <= 0x309F) ||       // Hiragana
            (code >= 0x30A0 && code <= 0x30FF) ||       // Katakana
            (code >= 0x4E00 && code <= 0x9FFF) ||       // CJK Unified Ideographs
            (code >= 0xAC00 && code <= 0xD7A3) ||       // Hangul Syllables
            (code >= 0xF900 && code <= 0xFAFF) ||       // CJK Compatibility Ideographs
            (code >= 0xFE10 && code <= 0xFE19) ||       // Vertical Forms
            (code >= 0xFE30 && code <= 0xFE6F) ||       // CJK Compatibility Forms
            (code >= 0xFF00 && code <= 0xFFEF) ||       // Halfwidth and Fullwidth Forms
            (code >= 0x1F300);                          // Most modern Emoji and Symbols
    }

    /**
     * @method getType
     * @description
     * @param char 
     * @returns 
     */
    public static getType = (char: string): CharType => {
        if (char === undefined || char === null) return CharType.Error;
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

