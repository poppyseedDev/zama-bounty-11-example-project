#!/usr/bin/env ts-node

/**
 * create-fhevm-category - CLI tool to generate FHEVM projects with multiple examples from a category
 *
 * Usage: ts-node scripts/create-fhevm-category.ts <category> [output-dir]
 *
 * Example: ts-node scripts/create-fhevm-category.ts basic ./output/fhevm-basic-examples
 */

import * as fs from 'fs';
import * as path from 'path';

// Color codes for terminal output
enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Red = '\x1b[31m',
  Cyan = '\x1b[36m',
  Magenta = '\x1b[35m',
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

// Contract item interface
interface ContractItem {
  path: string;
  test: string;
  fixture?: string;
  additionalFiles?: string[];
}

// Category configuration interface
interface CategoryConfig {
  name: string;
  description: string;
  contracts: ContractItem[];
  additionalDeps?: Record<string, string>;
}

// Category definitions
const CATEGORIES: Record<string, CategoryConfig> = {
  basic: {
    name: 'Basic FHEVM Examples',
    description: 'Fundamental FHEVM operations including encryption, decryption, and basic FHE operations',
    contracts: [
      { path: 'contracts/basic/FHECounter.sol', test: 'test/FHECounter.ts' },
      { path: 'contracts/basic/encrypt/EncryptSingleValue.sol', test: 'test/basic/encrypt/EncryptSingleValue.ts' },
      { path: 'contracts/basic/encrypt/EncryptMultipleValues.sol', test: 'test/basic/encrypt/EncryptMultipleValues.ts' },
      { path: 'contracts/basic/decrypt/UserDecryptSingleValue.sol', test: 'test/basic/decrypt/UserDecryptSingleValue.ts' },
      { path: 'contracts/basic/decrypt/UserDecryptMultipleValues.sol', test: 'test/basic/decrypt/UserDecryptMultipleValues.ts' },
      { path: 'contracts/basic/decrypt/PublicDecryptSingleValue.sol', test: 'test/basic/decrypt/PublicDecryptSingleValue.ts' },
      { path: 'contracts/basic/decrypt/PublicDecryptMultipleValues.sol', test: 'test/basic/decrypt/PublicDecryptMultipleValues.ts' },
      { path: 'contracts/basic/fhe-operations/FHEAdd.sol', test: 'test/basic/fhe-operators/FHEAdd.ts' },
      { path: 'contracts/basic/fhe-operations/FHEIfThenElse.sol', test: 'test/basic/fhe-operators/FHEIfThenElse.ts' },
    ],
  },
  auctions: {
    name: 'Auction Examples',
    description: 'Advanced auction implementations using confidential bids and prices',
    contracts: [
      {
        path: 'contracts/auctions/BlindAuction.sol',
        test: 'test/blindAuction/BlindAuction.ts',
        fixture: 'test/blindAuction/BlindAuction.fixture.ts',
      },
      {
        path: 'contracts/auctions/ConfidentialDutchAuction.sol',
        test: 'test/confidentialDutchAuction/ConfidentialDutchAuction.ts',
      },
    ],
  },
  openzeppelin: {
    name: 'OpenZeppelin Confidential Contracts',
    description: 'ERC7984 and confidential token implementations using OpenZeppelin library',
    contracts: [
      {
        path: 'contracts/openzeppelin-confidential-contracts/ERC7984Example.sol',
        test: 'test/openzeppelin-confidential-contracts/confidentialToken/confToken.test.ts',
        fixture: 'test/openzeppelin-confidential-contracts/confidentialToken/confToken.fixture.ts',
      },
      {
        path: 'contracts/openzeppelin-confidential-contracts/ERC7984ERC20WrapperMock.sol',
        test: 'test/openzeppelin-confidential-contracts/ERC7984Wrapper.test.ts',
      },
      {
        path: 'contracts/openzeppelin-confidential-contracts/SwapERC7984ToERC20.sol',
        test: 'test/openzeppelin-confidential-contracts/ERC7984Wrapper.test.ts',
      },
      {
        path: 'contracts/openzeppelin-confidential-contracts/SwapERC7984ToERC7984.sol',
        test: 'test/openzeppelin-confidential-contracts/ERC7984Wrapper.test.ts',
      },
    ],
    additionalDeps: {
      '@openzeppelin/confidential-contracts': '^0.1.0',
    },
  },
  games: {
    name: 'Game Examples',
    description: 'Privacy-preserving game implementations using FHEVM',
    contracts: [
      {
        path: 'contracts/fheWordle/FHEWordle.sol',
        test: 'test/fheWordle/FHEwordle.ts',
        fixture: 'test/fheWordle/FHEwordle.fixture.ts',
        additionalFiles: [
          'test/fheWordle/validWordsList.ts',
          'test/fheWordle/wordslist.ts',
        ],
      },
      {
        path: 'contracts/fheWordle/FHEWordleFactory.sol',
        test: 'test/fheWordle/FHEwordle.ts',
      },
    ],
  },
};

function copyDirectoryRecursive(source: string, destination: string, excludeDirs: string[] = []): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      if (excludeDirs.includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function getContractName(contractPath: string): string | null {
  const content = fs.readFileSync(contractPath, 'utf-8');
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : null;
}

function generateDeployScript(contractNames: string[]): string {
  return `import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

${contractNames.map(name => `  // Deploy ${name}
  const deployed${name} = await deploy("${name}", {
    from: deployer,
    log: true,
  });
  console.log(\`${name} contract: \${deployed${name}.address}\`);
`).join('\n')}
};

export default func;
func.id = "deploy_all";
func.tags = ["all", ${contractNames.map(n => `"${n}"`).join(', ')}];
`;
}

function generateReadme(category: string, contractNames: string[]): string {
  const categoryInfo = CATEGORIES[category];

  return `# FHEVM Examples: ${categoryInfo.name}

${categoryInfo.description}

## 📦 Included Examples

This project contains ${contractNames.length} example contract${contractNames.length > 1 ? 's' : ''}:

${contractNames.map((name, i) => `${i + 1}. **${name}**`).join('\n')}

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager

### Installation

1. **Install dependencies**

   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables**

   \`\`\`bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   \`\`\`

3. **Compile all contracts**

   \`\`\`bash
   npm run compile
   \`\`\`

4. **Run all tests**

   \`\`\`bash
   npm run test
   \`\`\`

## Contracts

${contractNames.map(name => `### ${name}

Located in \`contracts/${name}.sol\`

Run specific tests:
\`\`\`bash
npx hardhat test test/${name}.ts
\`\`\`
`).join('\n')}

## Deployment

### Local Network

\`\`\`bash
# Start local node
npx hardhat node

# Deploy all contracts
npx hardhat deploy --network localhost
\`\`\`

### Sepolia Testnet

\`\`\`bash
# Deploy all contracts
npx hardhat deploy --network sepolia

# Verify contracts
${contractNames.map(name => `npx hardhat verify --network sepolia <${name.toUpperCase()}_ADDRESS>`).join('\n')}
\`\`\`

## Available Scripts

| Script | Description |
|--------|-------------|
| \`npm run compile\` | Compile all contracts |
| \`npm run test\` | Run all tests |
| \`npm run test:sepolia\` | Run tests on Sepolia |
| \`npm run lint\` | Run all linters |
| \`npm run lint:sol\` | Lint Solidity only |
| \`npm run lint:ts\` | Lint TypeScript only |
| \`npm run prettier:check\` | Check formatting |
| \`npm run prettier:write\` | Auto-format code |
| \`npm run clean\` | Clean build artifacts |
| \`npm run coverage\` | Generate coverage report |

## Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Examples](https://docs.zama.org/protocol/examples)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## License

This project is licensed under the BSD-3-Clause-Clear License.

---

**Built with ❤️ using [FHEVM](https://github.com/zama-ai/fhevm) by Zama**
`;
}

function createCategoryProject(category: string, outputDir: string): void {
  const rootDir = path.resolve(__dirname, '..');
  const templateDir = path.join(rootDir, 'fhevm-hardhat-template');

  // Validate category
  if (!CATEGORIES[category]) {
    error(`Unknown category: ${category}\n\nAvailable categories:\n${Object.keys(CATEGORIES).map(k => `  - ${k}: ${CATEGORIES[k].name}`).join('\n')}`);
  }

  const categoryInfo = CATEGORIES[category];
  info(`Creating FHEVM project: ${categoryInfo.name}`);
  info(`Output directory: ${outputDir}`);

  // Check if output directory exists
  if (fs.existsSync(outputDir)) {
    error(`Output directory already exists: ${outputDir}`);
  }

  // Step 1: Copy template
  log('\n📋 Step 1: Copying template...', Color.Cyan);
  copyDirectoryRecursive(templateDir, outputDir, ['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist']);
  success('Template copied');

  // Step 2: Clear template contracts and tests
  log('\n🧹 Step 2: Clearing template files...', Color.Cyan);
  const contractsDir = path.join(outputDir, 'contracts');
  const testsDir = path.join(outputDir, 'test');

  // Remove template contract
  fs.readdirSync(contractsDir).forEach(file => {
    if (file.endsWith('.sol')) {
      fs.unlinkSync(path.join(contractsDir, file));
    }
  });

  // Remove template tests
  fs.readdirSync(testsDir).forEach(file => {
    if (file.endsWith('.ts')) {
      fs.unlinkSync(path.join(testsDir, file));
    }
  });
  success('Template files cleared');

  // Step 3: Copy all contracts and tests from category
  log('\n📄 Step 3: Copying contracts and tests...', Color.Cyan);
  const contractNames: string[] = [];
  const copiedTests = new Set<string>();

  categoryInfo.contracts.forEach(({ path: contractPath, test: testPath, fixture, additionalFiles }) => {
    // Copy contract
    const fullContractPath = path.join(rootDir, contractPath);
    if (!fs.existsSync(fullContractPath)) {
      log(`Warning: Contract not found: ${contractPath}`, Color.Yellow);
      return;
    }

    const contractName = getContractName(fullContractPath);
    if (contractName) {
      contractNames.push(contractName);
      const destContractPath = path.join(contractsDir, `${contractName}.sol`);
      fs.copyFileSync(fullContractPath, destContractPath);
      log(`  ✓ ${contractName}.sol`, Color.Green);
    }

    // Copy test (avoid duplicates)
    const fullTestPath = path.join(rootDir, testPath);
    if (fs.existsSync(fullTestPath) && !copiedTests.has(testPath)) {
      const testFileName = path.basename(testPath);
      const destTestPath = path.join(testsDir, testFileName);
      fs.copyFileSync(fullTestPath, destTestPath);
      copiedTests.add(testPath);
      log(`  ✓ ${testFileName}`, Color.Green);
    }

    // Copy fixture if exists
    if (fixture) {
      const fullFixturePath = path.join(rootDir, fixture);
      if (fs.existsSync(fullFixturePath) && !copiedTests.has(fixture)) {
        const fixtureFileName = path.basename(fixture);
        const destFixturePath = path.join(testsDir, fixtureFileName);
        fs.copyFileSync(fullFixturePath, destFixturePath);
        copiedTests.add(fixture);
        log(`  ✓ ${fixtureFileName}`, Color.Green);
      }
    }

    // Copy additional files if any
    if (additionalFiles) {
      additionalFiles.forEach(filePath => {
        const fullFilePath = path.join(rootDir, filePath);
        if (fs.existsSync(fullFilePath)) {
          const fileName = path.basename(filePath);
          const destFilePath = path.join(testsDir, fileName);
          fs.copyFileSync(fullFilePath, destFilePath);
          log(`  ✓ ${fileName}`, Color.Green);
        }
      });
    }
  });

  success(`Copied ${contractNames.length} contracts and their tests`);

  // Step 4: Generate deployment script
  log('\n⚙️  Step 4: Generating deployment script...', Color.Cyan);
  const deployScript = generateDeployScript(contractNames);
  const deployPath = path.join(outputDir, 'deploy', 'deploy.ts');
  fs.writeFileSync(deployPath, deployScript);
  success('Deployment script generated');

  // Step 5: Update package.json
  log('\n📦 Step 5: Updating package.json...', Color.Cyan);
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `fhevm-examples-${category}`;
  packageJson.description = categoryInfo.description;
  packageJson.homepage = `https://github.com/zama-ai/fhevm-examples/${category}`;

  // Add additional dependencies if needed
  if (categoryInfo.additionalDeps) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...categoryInfo.additionalDeps,
    };
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  success('package.json updated');

  // Step 6: Generate README
  log('\n📝 Step 6: Generating README...', Color.Cyan);
  const readme = generateReadme(category, contractNames);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  success('README.md generated');

  // Final summary
  log('\n' + '='.repeat(60), Color.Green);
  success(`FHEVM ${categoryInfo.name} project created successfully!`);
  log('='.repeat(60), Color.Green);

  log('\n📊 Project Summary:', Color.Magenta);
  log(`  Category: ${categoryInfo.name}`);
  log(`  Contracts: ${contractNames.length}`);
  log(`  Location: ${path.relative(process.cwd(), outputDir)}`);

  log('\n📦 Next steps:', Color.Yellow);
  log(`  cd ${path.relative(process.cwd(), outputDir)}`);
  log('  npm install');
  log('  npm run compile');
  log('  npm run test');

  log('\n🎉 Happy coding with FHEVM!', Color.Cyan);
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    log('FHEVM Category Project Generator', Color.Cyan);
    log('\nUsage: ts-node scripts/create-fhevm-category.ts <category> [output-dir]\n');
    log('Available categories:', Color.Yellow);
    Object.entries(CATEGORIES).forEach(([key, info]) => {
      log(`  ${key}`, Color.Green);
      log(`    ${info.name}`, Color.Cyan);
      log(`    ${info.description}`, Color.Reset);
      log(`    Contracts: ${info.contracts.length}`, Color.Blue);
    });
    log('\nExamples:', Color.Yellow);
    log('  ts-node scripts/create-fhevm-category.ts basic ./output/basic-examples');
    log('  ts-node scripts/create-fhevm-category.ts auctions ./output/auction-examples\n');
    process.exit(0);
  }

  const category = args[0];
  const outputDir = args[1] || path.join(process.cwd(), 'output', `fhevm-examples-${category}`);

  createCategoryProject(category, outputDir);
}

main();
