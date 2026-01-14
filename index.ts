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
    test?: number | number[];
    str?: any;
}

/**
 * The context object passed to each test function, containing the
 * string to be tested and an optional letter.
 * @property str The primary string input for the test.
 * @property ltr An optional secondary character or string for tests that require it (e.g., searching).
 */
interface TestContext {
    str: string;
    ltr?: string;
}

/**
 * Defines the structure for a test case definition.
 * It specifies the input strings and which test(s) to run.
 * @property str The primary string input for the test.
 * @property ltr An optional secondary character or string.
 * @property tests A single TestNumber or an array of TestNumbers to execute.
 */
interface TestDefContext {
    str: string;
    ltr?: string;
    tests: TestNumber | TestNumber[];
}

/** 
 * A union type representing the valid numbers for a test case. 
 */
type TestNumber = 1 | 2 | 3 | 4 | 5;

/** 
 * A function that executes a specific test scenario. 
 */
type TestFunction = (ctx: TestContext) => void;

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
    runTest: (testDefCtx: TestDefContext): void => {
        const { str, ltr, tests } = testDefCtx;
        // Normalize `tests` to always be an array for consistent processing.
        const testsArray = Array.isArray(tests) ? tests : [tests];
        const testCtx: TestContext = { str, ltr };

        testsArray.forEach((testNum: TestNumber) => testFunctions[testNum](testCtx));
    },
};

/**
 * A map of test implementations, where each key is a `TestNumber`
 * and the value is the corresponding test function.
 */
const testFunctions: Record<TestNumber, TestFunction> = {
    /**
     * Test 1: Creates a Char from a single character and outputs its raw,
     * character, and stored value representations.
     */
    [Test.one]: ({ str }: TestContext): void => {
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
     * Test 2: Creates a Char and displays its numeric value,
     * which is useful for non-digit characters.
     */
    [Test.two]: ({ str }: TestContext): void => {
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
     * Test 3: Finds a specific character within a string and displays its
     * properties, such as value, case, and position.
     */
    [Test.three]: ({ str, ltr }: TestContext): void => {
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
    [Test.four]: ({ str }: TestContext): void => {
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
     * Test 5: Demonstrates iterating over the `Char[]` array using a
     * for...of loop and inspecting each character.
     */
    [Test.five]: ({ str }: TestContext): void => {
        const chars = Char.fromString(str);
        util.insertTitle('FOR OF TEST:');
        for (const ch of chars) {
            console.log(util.inspect(ch));
        }
        util.insertReturn();;
    },
};

/**
 * A map of test definitions, where each key is a `TestNumber` and the value
 * is a `TestDefContext` object describing the test case.
 */
const testScenarios: Record<number, TestDefContext> = {
    [1]: { str: 'A', tests: 1 },
    [2]: { str: '🪖', tests: [Test.one, Test.two] },
    [3]: { str: `Hello, World!\nThis is line 2.`, ltr: 'W', tests: [3, 4, 5] },
    [4]: { str: `🪖⚔️🎖️🪖🎖️💪`, ltr: '⚔️', tests: Test.five },
    [5]: { str: '', ltr: '', tests: 1 },
    [6]: { str: 'rgba(100, 250, 255, 0.5)', tests: 5 },
};

/**
 * The main entry point for the script.
 * It iterates through all defined tests and executes them.
 */
const runTest = (ctx?: RunContext) => {
    // Scenario 1: No context provided - Run all pre-defined scenarios
    if (!ctx || (ctx.test === undefined && !ctx.str)) {
        for (const testDefCtx of Object.values(testScenarios)) {
            util.runTest(testDefCtx);
        }
        return;
    }

    // Scenario 2: Context provided
    const { test, str } = ctx;

    // Normalize test IDs into an array
    const testIds = test === undefined ? [] : (Array.isArray(test) ? test : [test]);

    if (str && testIds.length > 0) {
        // Logic: Run specific test logic (Enum) on a custom string
        util.runTest({
            str: str,
            tests: testIds as TestNumber[]
        });
    } else if (testIds.length > 0) {
        // Logic: Run pre-defined scenarios by their ID (1-6)
        for (const id of testIds) {
            const scenario = testScenarios[id];
            if (scenario) {
                util.runTest(scenario);
            } else {
                console.warn(`Scenario ID ${id} not found in testScenarios.`);
            }
        }
    }
};

// Run the main function to start the tests.
async function main() {
    const rl = readline.createInterface({ input, output });

    try {
        // 1. Gather input for 'str' (any type)
        const strInput = await rl.question("Enter value for 'str': ");

        // 2. Gather and parse input for 'test' (number or number[])
        const testInput = await rl.question("Enter 'test' (single number or comma-separated list): ");

        let testValue: number | number[] | undefined;

        // Parsing logic: Check if input contains commas for an array
        if (testInput.includes(',')) {
            testValue = testInput.split(',')
                .map(val => val.trim())
                .filter(val => val !== "") // Remove empty strings
                .map(Number); // Convert strings to numbers
        } else if (testInput.trim() !== "") {
            testValue = Number(testInput); // Single number conversion
        }

        // 3. Construct the RunContext object
        const context: RunContext = {
            test: testValue,
            str: strInput
        };

        // 4. Execute your function
        runTest(context);

    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        rl.close();
    }
}

main();
