// ./src/index.ts

import { Char } from './src/Char.ts';
import { styleText, inspect, type InspectOptions } from 'node:util';


// Types
interface TestContext {
    str: string;
    ltr?: string;
}
type TestNumber = 1 | 2 | 3 | 4 | 5;
type TestFunction = (ctx: TestContext) => void;


// Utility Functions
const util = {
    // Prints a new line on the console
    insertReturn: (): void => {
        console.log('\r');
    },

    // Inspects and displays a insertTitle on the console
    insertTitle: (str: string): void => {
        console.log(styleText(['red', 'bold'], str));
    },

    // Styles a string
    style: (str: string): string => {
        return styleText(['blue', 'bold'], str);
    },

    // Returns a stylized Char
    inspect: (ch: Char): string => {
        // node:util.inspect options
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

        return inspect(ch, inspectOptions);
    },
};

// Map of test functions
const testMap: Record<TestNumber, TestFunction> = {
    /**
     * Creates a Char from a single str character, outputs result to console
     */
    1: ({ str }): void => {
        if (str.length === 0) return;
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
     * Creates a Char from a single character string and displays its ininspection on the console
     */
    2: ({ str }): void => {
        if (str.length === 0) return;
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
     * Finds a character within a Char[], outputs result to console
     */
    3: ({ str, ltr }): void => {
        if (!ltr) return;
        const chars = Char.fromString(str);
        // Normalize both strings to a standard form (e.g., 'NFC' is common)
        // Ensure 'ltr' is a single grapheme cluster if intended
        const normalizedLtr = ltr.normalize('NFC');

        const ch = chars.find(char => {
            // Normalize the character from the array as well before comparison
            return char.value.normalize('NFC') === normalizedLtr;
        });

        if (ch) {
            //insertReturn();
            util.insertTitle('FIND CHARACTER TEST:');
            console.log(`--- Found the character '${ltr}' ---`);
            console.log(`Value: ${ch.value}`);
            // Consider using locale-aware checks for case
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
     * Iterates over Char[] to find whitespace, outputs result to console
     */
    4: ({ str }): void => {
        const chars = Char.fromString(str);
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
     * Use For-Of to iterate over Char[], outputs each Char to console
     */
    5: ({ str }): void => {
        const chars = Char.fromString(str);
        util.insertTitle('FOR OF TEST:');
        for (const ch of chars) {
            console.log(util.inspect(ch));
        }

        util.insertReturn();;
    },
} 

// Execute tests
const runTest = (str: string, tests: TestNumber[], ltr?: string): void => {
    const ctx = { str, ltr };
    tests.forEach(num => testMap[num](ctx));
}

// Test strings
const charA = 'A';
const charB = '🪖';
const myStringA = `Hello, World!\nThis is line 2.`;
const myStringB = `🪖\t\⚔️ 🎖️\n🪖\t\🎖️ 💪`;

// Execute tests with test strings
console.clear();
runTest(charA, [1]);
runTest(charB, [1]);
runTest('Ⅷ', [2]);
runTest('⑩', [2]);
runTest(myStringA, [3, 4, 5], 'W');
runTest(myStringB, [3, 4, 5], '⚔️');
