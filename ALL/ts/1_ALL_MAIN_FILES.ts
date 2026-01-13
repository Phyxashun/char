

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./src/Char.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./src/Char.ts

import { inspect, type BunInspectOptions } from 'bun';
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
 * @class Position
 * @description - A class representing the position of a sub-object within another object
 * @property {number} index  - The zero-based index of the character within the source object.
 * @property {number} line   - The line number of the character within the source object.
 * @property {number} column - The column number of the character within the source object.
 */
export class Position {
    constructor(
        public index: number = -1,
        public line: number = -1,
        public column: number = -1
    ) { }
}

export class IChar {
    public type: CharType;
    #value: Uint16Array;
    #isSubstring: boolean;
    public position: Position;

    constructor(type?: CharType, value?: string, isSubstring?: boolean, position?: Position) {
        this.type = type ?? CharType.Undefined;
        this.#value = new Uint16Array();
        this.value = value ?? '';
        this.#isSubstring = isSubstring ?? false;
        this.position = position ? position : new Position();
    }

    public get isSubstring(): boolean {
        return this.#isSubstring && this.position && this.position.index !== -1
    }

    public set isSubstring(value: boolean) {
        this.#isSubstring = value;
    }

    public get value(): string {
        return String.fromCharCode(...this.#value);
    }

    public set value(character: string) {
        if (!character || [...character].length !== 1) {
            throw new Error("Input must be a single Unicode character.");
        }

        const unicodeValue: number[] = [];
        for (let i = 0; i < character.length; i++) {
            unicodeValue.push(character.charCodeAt(i));
        }

        // Store these code units in a Uint16Array.
        this.#value = new Uint16Array(unicodeValue);
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
        } = {}
    ) {
        if (!character || [...character].length !== 1) {
            throw new Error("Input must be a single Unicode character.");
        }
        const isSubstring = options.isSubstring ?? false;
        const position = options.position;

        super(Char.getType(character), character, isSubstring, position);
        this.raw = character;
    }

    public override toString(): string {
        const rawChar = this.value;
        switch (rawChar) {
            // Return the escaped representation directly
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            // Return the character itself
            default: return rawChar;
        }
    }

    public get [Symbol.toStringTag](): string {
        return 'Char';
    }

    /**
     * Custom inspector for util.inspect.
     * @param depth The current recursion depth.
     * @param options The inspection options, which *now* correctly contains `stylize`.
     * @param inspect The util.inspect function itself (useful for recursive calls).
     */
    [inspect.custom] = (depth: number, options: BunInspectOptions, inspectFn: Function): string => {
        const stylize = (options as any).stylize;

        // If recursion depth is exhausted, show a placeholder.
        if (depth < 0) return stylize(`[Char]`, 'special');

        // Get the class name and stylize it. Using `this.constructor.name` is robust.
        const CLASSNAME = stylize(this.constructor.name, 'special'); 

        // Get the character value representation from `toString()` method.
        const charString   = `'${this.toString()}'`;
        const charPadStart = charString.padStart(4, ' ')
        const charPadEnd   = charPadStart.padEnd(4, ' ');
        const CHAR         = stylize(`${charPadEnd}`, 'date');

        // Handle the position info if it exists.
        let IDX = '', POS = '';
        if (this.isSubstring) {
            // Stylize the index, line and column numbers.
            const idxPadStart    = `${this.position.index}` .padStart(2, ' ');
            const linPadStart    = `${this.position.line}`  .padStart(2, ' ');
            const colPadStart    = `${this.position.column}`.padStart(2, ' ');
            const linColInfo     = `[ ${linPadStart} : ${colPadStart} ]`
            const posInfo        = stylize(linColInfo, 'number');

            IDX = stylize(`[${idxPadStart}]`, 'number');
            POS = `, pos: ${posInfo}`;
        }

        // Get the type and stylize it.
        const typePadEnd = this.type.padEnd(11, ' ');
        const typeInfo   = stylize(typePadEnd, 'string');
        const charType   = stylize(`CharType.`, 'special');
        const TYPE       = `type: ${charType}${typeInfo}${POS}`;

        // Combine everything into the final string.
        return `${CLASSNAME}${IDX}: ${CHAR}: { ${TYPE} }`;
    }

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
        return this.isLetter() || this.isNumber();
    }

    public isNewLine(): boolean {
        return this.type === CharType.NewLine;
    }

    public isWhitespace(): boolean {
        // A newline is also considered whitespace
        return this.type === CharType.Whitespace || this.type === CharType.NewLine;
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

    public isUpperCase(): boolean {
        const char = this.toString();
        return this.isLetter() && char === char.toUpperCase();
    }

    public isLowerCase(): boolean {
        const char = this.toString();
        return this.isLetter() && char === char.toLowerCase();
    }

    public getNumericValue(): number {
        return this.isNumber() ? parseInt(this.toString(), 10) : -1;
    }

    public charValue(): string {
        return this.value;
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
        let line = 1;
        let column = 1;

        // Use Array.from(str) to correctly handle multi-byte Unicode characters
        const characters = Array.from(str);

        for (let i = 0; i < characters.length; i++) {
            const charValue = characters[i]!;
            const position = new Position(i, line, column);

            chars.push(new Char(charValue, {
                isSubstring: true,
                position: position
            }));

            if (charValue === '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }
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
    public static calculatePosition = (text: string, index: number): Position => {
        let line = 1;
        let column = 1;

        for (let i = 0; i < index; i++) {
            if (text[i] === '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }
        }

        return { index, line, column };
    };

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
};




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./src/CharType.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./src/CharSpec.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./src/CharSpec.ts

import { CharType } from "./CharType.ts";

type CharSpecFn = (char: string) => boolean;

export const CharSpec: Map<CharType, CharSpecFn> = new Map([
    [CharType.EOF, (char: string) => char === ''],
    [CharType.NewLine, (char: string) => /[\n\r]/.test(char)],
    [CharType.Whitespace, (char: string) => /[ \t\f\v]/.test(char)],
    [CharType.Letter, (char: string) => /\p{L}/u.test(char)],
    [CharType.Number, (char: string) => /\p{N}/u.test(char)],
    [CharType.Emoji, (char: string) => /\p{Emoji_Presentation}/v.test(char)],
    [CharType.Currency, (char: string) => /\p{Sc}/u.test(char)],
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
    [CharType.Punctuation, (char: string) => /\p{P}/u.test(char)],
    [CharType.Symbol, (char: string) => /\p{S}/u.test(char)],
    [CharType.Unicode, (char: string) => /\P{ASCII}/u.test(char)],
]);




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./src/CharSpec.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./index.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




// ./src/index.ts

import { Char } from './src/Char.ts';
import { styleText, inspect, type InspectOptions } from 'node:util';

const inspectOptions: InspectOptions = {
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
};

const title = (str: string): void => {
    console.log(styleText(['red', 'bold'], str));
}

const format = (ch: any): string => {
    return inspect(ch, inspectOptions);
};

const test1 = (str: string): void => {
    console.log();
    const char = new Char(str);
    title('CHARACTER TEST:');
    console.log(`raw:\t${str}`);
    console.log(`char:\tCharacter: ${format(char)}`);
    console.log(`char:\tStored data: ${char.value}`);
    console.log();
};

const test2 = (str: string, letter: string): void => {
    const testFindCharacter = (chars: Char[], ltr: string): void => {
        const ch = chars.find(char => char.charValue() === ltr);
        if (ch) {
            console.log();
            title('FIND CHARACTER TEST:');
            console.log(`--- Found the character '${ltr}' ---`);
            console.log(`Value: ${ch.charValue()}`);
            console.log(`Is it uppercase? ${ch.isUpperCase()}`);
            if (ch.position) {
                console.log(`Index in string: ${ch.position.index}`);
                console.log(`Line number: ${ch.position.line}`);
                console.log(`Column number: ${ch.position.column}`);
            }
        }
        console.log();
    };

    const testIterate = (chars: Char[]): void => {
        console.log();
        title('ITERATE TEST:');
        chars.forEach(ch => {
            if (ch.isWhitespace() && ch.position) {
                console.log(`Found a whitespace character at line ${ch.position.line}, column ${ch.position.column}`);
            }
            if (ch.isNewLine() && ch.position) {
                console.log(`Found a newline character at line ${ch.position.line}, column ${ch.position.column}`);
            }
        });
        console.log();
    };

    const testForOf = (chars: Char[]): void => {
        console.log();

        title('FOR OF TEST:')
        for (const ch of chars) {
            console.log(format(ch));
        }

        console.log();
    };
    
    const characters = Char.fromString(str);
    testFindCharacter(characters, letter);
    testIterate(characters);
    testForOf(characters);

};

const charA = 'A';
const charB = '💩';
const myString = `Hello, World!\nThis is line 2.`;

test1(charA);
test1(charB);
test2(myString, 'W');




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./index.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████
