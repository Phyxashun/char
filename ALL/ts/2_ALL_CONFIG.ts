

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./.gitignore ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




# dependencies (bun install)
node_modules

# output
out
dist
*.tgz

# code coverage
coverage
*.lcov

# logs
logs
_.log
report.[0-9]_.[0-9]_.[0-9]_.[0-9]_.json

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# caches
.eslintcache
.cache
*.tsbuildinfo

# IntelliJ based IDEs
.idea

# Finder (MacOS) folder config
.DS_Store





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./.gitignore ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./package.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




{
  "name": "char",
  "module": "index.ts",
  "type": "module",
  "devDependencies": {
    "@types/bun": "^1.3.5",
    "@types/node": "^25.0.6",
    "@vitest/coverage-v8": "^4.0.17",
    "bun": "^1.3.5",
    "consolidate": "link:consolidate",
    "logger": "link:logger",
    "typedoc": "^0.28.16",
    "vitest": "^4.0.17"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "bin": {
    "char": "./index.ts"
  },
  "scripts": {
    "start": "bun run ./index.ts",
    "test": "vitest",
    "coverage": "vitest --coverage"
  }
}





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./package.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./tsconfig.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■





{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    
    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  },
  "include": [
    "./src/**/*.ts",
    "./src/**/*.d.ts",
    "./src/global.d.ts"
, "index.ts"  ],
  "exclude": [
    "./ALL/**/*.*"
  ]
}




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./tsconfig.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████
