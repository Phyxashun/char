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
