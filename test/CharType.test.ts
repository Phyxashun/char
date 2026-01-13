// ./test/CharType.test.ts

import { describe, it, expect } from 'vitest';
import { CharType } from '../src/CharType';

describe('CharType Enum', () => {
    it('should have the expected control types', () => {
        expect(CharType.EOF).toBe('EOF');
        expect(CharType.Undefined).toBe('Undefined');
    });

    it('should have the expected literal types', () => {
        expect(CharType.Letter).toBe('Letter');
        expect(CharType.Number).toBe('Number');
        expect(CharType.Emoji).toBe('Emoji');
    });
});