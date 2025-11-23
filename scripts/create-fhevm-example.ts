#!/usr/bin/env ts-node

/**
 * create-fhevm-example - CLI tool to generate standalone FHEVM example repositories
 *
 * Usage: ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
 *
 * Example: ts-node scripts/create-fhevm-example.ts fhe-counter ./my-fhe-counter
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Color codes for terminal output
enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Red = '\x1b[31m',
  Cyan = '\x1b[36m',
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

// Example configuration interface
interface ExampleConfig {
  contract: string;
  test: string;
  testFixture?: string;
  description: string;
}

// Map of example names to their contract and test paths
const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  'fhe-counter': {
    contract: 'contracts/basic/FHECounter.sol',
    test: 'test/FHECounter.ts',
    description: 'A simple FHE counter demonstrating basic encrypted operations',
  },
  'encrypt-single-value': {
    contract: 'contracts/basic/encrypt/EncryptSingleValue.sol',
    test: 'test/basic/encrypt/EncryptSingleValue.ts',
    description: 'Demonstrates FHE encryption mechanism and common pitfalls',
  },
  'encrypt-multiple-values': {
    contract: 'contracts/basic/encrypt/EncryptMultipleValues.sol',
    test: 'test/basic/encrypt/EncryptMultipleValues.ts',
    description: 'Shows how to encrypt and handle multiple values',
  },
  'user-decrypt-single-value': {
    contract: 'contracts/basic/decrypt/UserDecryptSingleValue.sol',
    test: 'test/basic/decrypt/UserDecryptSingleValue.ts',
    description: 'Demonstrates user decryption and permission requirements',
  },
  'user-decrypt-multiple-values': {
    contract: 'contracts/basic/decrypt/UserDecryptMultipleValues.sol',
    test: 'test/basic/decrypt/UserDecryptMultipleValues.ts',
    description: 'Shows how to decrypt multiple encrypted values',
  },
  'public-decrypt-single-value': {
    contract: 'contracts/basic/decrypt/PublicDecryptSingleValue.sol',
    test: 'test/basic/decrypt/PublicDecryptSingleValue.ts',
    description: 'Demonstrates public decryption mechanism',
  },
  'public-decrypt-multiple-values': {
    contract: 'contracts/basic/decrypt/PublicDecryptMultipleValues.sol',
    test: 'test/basic/decrypt/PublicDecryptMultipleValues.ts',
    description: 'Shows public decryption with multiple values',
  },
  'fhe-add': {
    contract: 'contracts/basic/fhe-operations/FHEAdd.sol',
    test: 'test/basic/fhe-operators/FHEAdd.ts',
    description: 'Demonstrates FHE addition operations',
  },
  'fhe-if-then-else': {
    contract: 'contracts/basic/fhe-operations/FHEIfThenElse.sol',
    test: 'test/basic/fhe-operators/FHEIfThenElse.ts',
    description: 'Shows conditional operations on encrypted values',
  },
  'blind-auction': {
    contract: 'contracts/auctions/BlindAuction.sol',
    test: 'test/blindAuction/BlindAuction.ts',
    testFixture: 'test/blindAuction/BlindAuction.fixture.ts',
    description: 'Sealed-bid auction with confidential bids',
  },
  'confidential-dutch-auction': {
    contract: 'contracts/auctions/ConfidentialDutchAuction.sol',
    test: 'test/confidentialDutchAuction/ConfidentialDutchAuction.ts',
    description: 'Dutch auction with encrypted prices',
  },
  'erc7984-example': {
    contract: 'contracts/openzeppelin-confidential-contracts/ERC7984Example.sol',
    test: 'test/openzeppelin-confidential-contracts/confidentialToken/confToken.test.ts',
    testFixture: 'test/openzeppelin-confidential-contracts/confidentialToken/confToken.fixture.ts',
    description: 'ERC7984 confidential token standard implementation',
  },
};

function copyDirectoryRecursive(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // Skip node_modules, artifacts, cache, etc.
      if (['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist'].includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function getContractName(contractPath: string): string | null {
  const content = fs.readFileSync(contractPath, 'utf-8');
  // Match contract declaration, ignoring comments and ensuring it's followed by 'is' or '{'
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : null;
}

function updateDeployScript(outputDir: string, contractName: string): void {
  const deployScriptPath = path.join(outputDir, 'deploy', 'deploy.ts');

  const deployScript = `import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed${contractName} = await deploy("${contractName}", {
    from: deployer,
    log: true,
  });

  console.log(\`${contractName} contract: \`, deployed${contractName}.address);
};
export default func;
func.id = "deploy_${contractName.toLowerCase()}";
func.tags = ["${contractName}"];
`;

  fs.writeFileSync(deployScriptPath, deployScript);
}

function updatePackageJson(outputDir: string, exampleName: string, description: string): void {
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `fhevm-example-${exampleName}`;
  packageJson.description = description;
  packageJson.homepage = `https://github.com/zama-ai/fhevm-examples/${exampleName}`;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function generateReadme(exampleName: string, description: string, contractName: string): string {
  return `# FHEVM Example: ${exampleName}

${description}

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

3. **Compile and test**

   \`\`\`bash
   npm run compile
   npm run test
   \`\`\`

## Contract

The main contract is \`${contractName}\` located in \`contracts/${contractName}.sol\`.

## Testing

Run the test suite:

\`\`\`bash
npm run test
\`\`\`

For Sepolia testnet testing:

\`\`\`bash
npm run test:sepolia
\`\`\`

## Deployment

Deploy to local network:

\`\`\`bash
npx hardhat node
npx hardhat deploy --network localhost
\`\`\`

Deploy to Sepolia:

\`\`\`bash
npx hardhat deploy --network sepolia
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
\`\`\`

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

function createExample(exampleName: string, outputDir: string): void {
  const rootDir = path.resolve(__dirname, '..');
  const templateDir = path.join(rootDir, 'fhevm-hardhat-template');

  // Check if example exists
  if (!EXAMPLES_MAP[exampleName]) {
    error(`Unknown example: ${exampleName}\n\nAvailable examples:\n${Object.keys(EXAMPLES_MAP).map(k => `  - ${k}`).join('\n')}`);
  }

  const example = EXAMPLES_MAP[exampleName];
  const contractPath = path.join(rootDir, example.contract);
  const testPath = path.join(rootDir, example.test);

  // Validate paths exist
  if (!fs.existsSync(contractPath)) {
    error(`Contract not found: ${example.contract}`);
  }
  if (!fs.existsSync(testPath)) {
    error(`Test not found: ${example.test}`);
  }

  info(`Creating FHEVM example: ${exampleName}`);
  info(`Output directory: ${outputDir}`);

  // Step 1: Copy template
  log('\n📋 Step 1: Copying template...', Color.Cyan);
  if (fs.existsSync(outputDir)) {
    error(`Output directory already exists: ${outputDir}`);
  }
  copyDirectoryRecursive(templateDir, outputDir);
  success('Template copied');

  // Step 2: Copy contract
  log('\n📄 Step 2: Copying contract...', Color.Cyan);
  const contractName = getContractName(contractPath);
  if (!contractName) {
    error('Could not extract contract name from contract file');
  }
  const destContractPath = path.join(outputDir, 'contracts', `${contractName}.sol`);

  // Remove template contract
  const templateContract = path.join(outputDir, 'contracts', 'FHECounter.sol');
  if (fs.existsSync(templateContract)) {
    fs.unlinkSync(templateContract);
  }

  fs.copyFileSync(contractPath, destContractPath);
  success(`Contract copied: ${contractName}.sol`);

  // Step 3: Copy test
  log('\n🧪 Step 3: Copying test...', Color.Cyan);
  const destTestPath = path.join(outputDir, 'test', path.basename(testPath));

  // Remove template tests
  const testDir = path.join(outputDir, 'test');
  fs.readdirSync(testDir).forEach(file => {
    if (file.endsWith('.ts')) {
      fs.unlinkSync(path.join(testDir, file));
    }
  });

  fs.copyFileSync(testPath, destTestPath);
  success(`Test copied: ${path.basename(testPath)}`);

  // Copy test fixture if it exists
  if (example.testFixture) {
    const fixtureSourcePath = path.join(rootDir, example.testFixture);
    if (fs.existsSync(fixtureSourcePath)) {
      const destFixturePath = path.join(outputDir, 'test', path.basename(example.testFixture));
      fs.copyFileSync(fixtureSourcePath, destFixturePath);
      success(`Test fixture copied: ${path.basename(example.testFixture)}`);
    }
  }

  // Step 4: Update configuration files
  log('\n⚙️  Step 4: Updating configuration...', Color.Cyan);
  updateDeployScript(outputDir, contractName);
  updatePackageJson(outputDir, exampleName, example.description);
  success('Configuration updated');

  // Step 5: Generate README
  log('\n📝 Step 5: Generating README...', Color.Cyan);
  const readme = generateReadme(exampleName, example.description, contractName);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  success('README.md generated');

  // Step 6: Update tasks directory
  log('\n🔧 Step 6: Updating tasks...', Color.Cyan);
  const tasksDir = path.join(outputDir, 'tasks');
  if (fs.existsSync(tasksDir)) {
    // Update or remove contract-specific task file
    const oldTaskFile = path.join(tasksDir, 'FHECounter.ts');
    const newTaskFile = path.join(tasksDir, `${contractName}.ts`);

    if (fs.existsSync(oldTaskFile)) {
      // Read the task file and replace FHECounter with the new contract name
      let taskContent = fs.readFileSync(oldTaskFile, 'utf-8');

      // Replace all occurrences of FHECounter with the new contract name
      taskContent = taskContent.replace(/FHECounter/g, contractName);
      taskContent = taskContent.replace(/fheCounter/g, contractName.charAt(0).toLowerCase() + contractName.slice(1));

      // Write to new file
      fs.writeFileSync(newTaskFile, taskContent);

      // Remove old file if different name
      if (oldTaskFile !== newTaskFile) {
        fs.unlinkSync(oldTaskFile);
      }

      success(`Updated tasks/${contractName}.ts`);
    }

    // Keep accounts.ts as-is (it's generic)
    success('Tasks directory preserved');
  }
  success('Cleanup complete');

  // Final summary
  log('\n' + '='.repeat(60), Color.Green);
  success(`FHEVM example "${exampleName}" created successfully!`);
  log('='.repeat(60), Color.Green);

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
    log('FHEVM Example Generator', Color.Cyan);
    log('\nUsage: ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]\n');
    log('Available examples:', Color.Yellow);
    Object.entries(EXAMPLES_MAP).forEach(([name, info]) => {
      log(`  ${name}`, Color.Green);
      log(`    ${info.description}`, Color.Reset);
    });
    log('\nExample:', Color.Yellow);
    log('  ts-node scripts/create-fhevm-example.ts fhe-counter ./my-fhe-counter\n');
    process.exit(0);
  }

  const exampleName = args[0];
  const outputDir = args[1] || path.join(process.cwd(), 'output', `fhevm-example-${exampleName}`);

  createExample(exampleName, outputDir);
}

main();
