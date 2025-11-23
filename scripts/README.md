# FHEVM Example Generator Scripts

This directory contains automation scripts for generating standalone FHEVM example repositories and documentation.

## Scripts Overview

### 1. `create-fhevm-example.js` - Single Example Generator

Generates a complete, standalone FHEVM example repository from the base template.

**Usage:**
```bash
ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
```

**Features:**
- Clones the `fhevm-hardhat-template/` base template
- Copies specified contract from `contracts/`
- Copies corresponding test from `test/`
- Updates deployment scripts with correct contract name
- Generates example-specific README.md
- Updates package.json with example metadata
- Creates a ready-to-use, standalone repository

**Available Examples:**
- `fhe-counter` - Basic encrypted counter
- `encrypt-single-value` - Single value encryption
- `encrypt-multiple-values` - Multiple value encryption
- `user-decrypt-single-value` - User decryption single
- `user-decrypt-multiple-values` - User decryption multiple
- `public-decrypt-single-value` - Public decryption single
- `public-decrypt-multiple-values` - Public decryption multiple
- `fhe-add` - FHE addition operations
- `fhe-if-then-else` - FHE conditional operations
- `blind-auction` - Sealed-bid auction
- `confidential-dutch-auction` - Dutch auction with encryption
- `erc7984-example` - ERC7984 confidential token

**Example:**
```bash
# Generate fhe-counter example
ts-node scripts/create-fhevm-example.ts fhe-counter ./output/fhe-counter-example

# Navigate to generated example
cd output/fhe-counter-example

# Install and test
npm install
npm run compile
npm run test
```

### 2. `create-fhevm-category.js` - Category Project Generator

Generates a project containing all examples from a specific category.

**Usage:**
```bash
ts-node scripts/create-fhevm-category.ts <category> [output-dir]
```

**Features:**
- Copies all contracts from a category
- Includes all corresponding tests
- Generates unified deployment script for all contracts
- Creates comprehensive README listing all examples
- Perfect for learning multiple related concepts at once

**Available Categories:**
- `basic` - 9 contracts (FHE operations, encryption, decryption)
- `auctions` - 2 contracts (Blind auction, Dutch auction)
- `openzeppelin` - 4 contracts (ERC7984, token wrappers, swaps)
- `games` - 2 contracts (FHEWordle)

**Example:**
```bash
# Generate basic examples project
ts-node scripts/create-fhevm-category.ts basic ./output/basic-examples

# Navigate and test
cd output/basic-examples
npm install
npm run compile
npm run test
```

### 3. `generate-docs.js` - Documentation Generator

Generates GitBook-formatted documentation from contract and test files.

**Usage:**
```bash
node scripts/generate-docs.js <example-name>
node scripts/generate-docs.js --all
```

**Features:**
- Extracts contract and test code
- Generates GitBook markdown with tabs
- Creates side-by-side contract/test view
- Auto-updates `examples/SUMMARY.md`
- Includes hints and proper formatting

**Example:**
```bash
# Generate docs for single example
ts-node scripts/generate-docs.ts fhe-counter

# Generate all documentation
ts-node scripts/generate-docs.ts --all
```

**Output Format:**
The generator creates GitBook-compatible markdown files in `examples/` with:
- Description and info hints
- Tabbed interface for contract and test code
- Proper syntax highlighting
- Organized by category in SUMMARY.md

## Development Workflow

### Creating a New Example

1. **Write the contract** in `contracts/<category>/`
   ```solidity
   // contracts/basic/MyExample.sol
   contract MyExample is SepoliaConfig {
       // Implementation with detailed comments
   }
   ```

2. **Write comprehensive tests** in `test/<category>/`
   ```typescript
   // test/basic/MyExample.ts
   describe("MyExample", function () {
       // Tests with explanatory comments
       // Include both success and failure cases
   });
   ```

3. **Add to script configurations**
   - Update `EXAMPLES_MAP` in `create-fhevm-example.ts`
   - Update `EXAMPLES_CONFIG` in `generate-docs.ts`

4. **Generate documentation**
   ```bash
   ts-node scripts/generate-docs.ts my-example
   ```

5. **Create standalone repo**
   ```bash
   ts-node scripts/create-fhevm-example.ts my-example ./output/my-example
   ```

### Testing Generated Examples

Always test that generated examples work:
```bash
cd output/my-example
npm install
npm run compile
npm run test
npm run lint
```

## File Structure

```
scripts/
├── README.md                    # This file
├── create-fhevm-example.ts     # Repository generator (TypeScript)
├── create-fhevm-category.ts    # Category project generator (TypeScript)
└── generate-docs.ts            # Documentation generator (TypeScript)
```

**Note:** All scripts are written in TypeScript for better type safety and maintainability.

## Configuration

All scripts use TypeScript configuration objects that map example names to their source files:

**create-fhevm-example.ts:**
```typescript
interface ExampleConfig {
  contract: string;
  test: string;
  testFixture?: string;
  description: string;
}

const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  'example-name': {
    contract: 'path/to/contract.sol',
    test: 'path/to/test.ts',
    testFixture: 'path/to/fixture.ts',  // Optional
    description: 'Short description',
  },
  // ...
};
```

**generate-docs.ts:**
```typescript
interface DocsConfig {
  title: string;
  description: string;
  contract: string;
  test: string;
  output: string;
  category: string;
}

const EXAMPLES_CONFIG: Record<string, DocsConfig> = {
  'example-name': {
    title: 'Display Title',
    description: 'Full description for docs',
    contract: 'path/to/contract.sol',
    test: 'path/to/test.ts',
    output: 'examples/output-file.md',
    category: 'Category Name',
  },
  // ...
};
```

## Contributing

When adding new examples:
1. Ensure contracts include detailed comments explaining FHE concepts
2. Tests should demonstrate both correct usage and common pitfalls
3. Use ✅/❌ markers to highlight good vs bad patterns
4. Update both script configurations
5. Test the generated standalone repository
6. Verify documentation renders correctly in GitBook

## Maintenance

When updating `@fhevm/solidity` or other dependencies:
1. Update the base template in `fhevm-hardhat-template/`
2. Regenerate all examples to ensure compatibility
3. Update documentation if APIs have changed
4. Test all generated examples compile and pass tests

```bash
# Quick regeneration of all docs
ts-node scripts/generate-docs.ts --all
```

## Troubleshooting

**Contract name extraction fails:**
- Ensure contract declaration is on its own line
- Format: `contract ContractName is BaseContract {`

**Generated example doesn't compile:**
- Check that all dependencies are in base template
- Verify import paths are correct
- Ensure no template-specific files are referenced

**Documentation missing in SUMMARY.md:**
- Check category name matches existing categories
- Verify output path is in `examples/` directory
- Run generator again without `--no-summary` flag
