// ./src/index.ts

import { Char } from './Char.ts';
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