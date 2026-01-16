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
