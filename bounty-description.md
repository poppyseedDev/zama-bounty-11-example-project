# Developer Program Bounty Track November-December 2025: Build FHEVM Example Repositories

The Zama Bounty Program aims to inspire and incentivize the developer community to contribute to the Zama Confidential Blockchain Protocol.

Each season, we introduce a new bounty that addresses a specific challenge. With this initiative, we invite developers to collaborate with us in advancing the FHE ecosystem.

For this season, the challenge is to **build a set of standalone, Hardhat-based FHEVM example repositories, each demonstrating one clear concept (e.g., access control, public decryption, user decryption), with clean tests, automated scaffolding, and self-contained documentation**. The prize pool for this challenge is **$10,000.**

# **Important dates**

- Start date: **November 24, 2025**
- Submission deadline: **December 15, 2025** (23:59, Anywhere On Earth)

## Overview

The goal of this bounty is to create a comprehensive system for generating standalone FHEVM example repositories that help developers learn and implement privacy-preserving smart contracts using Fully Homomorphic Encryption.

### 📚 **Example Project**

A starter example implementation of this bounty can be found here:
**https://github.com/poppyseedDev/zama-bounty-11-example-project**

This repository demonstrates:
- Automated scaffolding tools for generating example repositories
- Documentation generation from code annotations
- Category-based project generation
- Complete implementation of the bounty requirements

## How to Participate

Participants should create a repository containing:

1. **Automation Scripts** - TypeScript-based CLI tools for generating example repositories
2. **Example Contracts** - Well-documented Solidity contracts demonstrating FHEVM concepts
3. **Comprehensive Tests** - Test suites showing both correct usage and common pitfalls
4. **Documentation Generator** - Tool to create GitBook-compatible documentation
5. **Base Template** - Using our [Hardhat template](https://github.com/zama-ai/fhevm-hardhat-template) which can be cloned and slightly customized

Check out the example implementation at https://github.com/poppyseedDev/zama-bounty-11-example-project to see:
- How to structure your automation scripts
- Example contract and test patterns
- Documentation generation workflow
- Category-based project generation

---

## Requirements

### 1. **Project Structure & Simplicity**

- **Use only Hardhat** for all examples
- **One repo per example**, no monorepo
- Keep each repo minimal: `contracts/`, `test/`, `hardhat.config.ts`, etc.
- Use a shared `base-template` that can be cloned/scaffolded
- Generate documentation like seen in https://github.com/zama-ai/fhevm/tree/main/docs/examples relates to page https://docs.zama.org/protocol/examples/

### 2. **Scaffolding / Automation**

Create a CLI or script (`create-fhevm-example`) to:
- Clone and slightly customize the base Hardhat template - https://github.com/zama-ai/fhevm-hardhat-template
- Insert a specific Solidity contract into `contracts/`
- Generate matching tests
- Auto-generate documentation from annotations in code

**Example Implementation:** See the example project for working `create-fhevm-example.ts` and `create-fhevm-category.ts` scripts written in TypeScript.

### 3. **Types of Examples to Include**

**(Each of these becomes a standalone repo)**:

#### Examples that we already have:

**Basic:**
- Simple FHE counter
- Arithmetic (FHE.add, FHE.sub)
- Equality comparison (FHE.eq)

**Encryption:**
- Encrypt single value
- Encrypt multiple values

**User Decryption:**
- User decrypt single value
- User decrypt multiple values

**Public Decryption:**
- Single value public decrypt
- Multi value public decrypt

#### Additional example items to include:

**🔒 Access Control:**
- What is access control
- FHE.allow, FHE.allowTransient

**Input Proof Explanation:**
- What are input proofs and why they're needed
- How to use them correctly

**❌ Anti-patterns:**
- View functions with encrypted values (not allowed)
- Missing FHE.allowThis() permissions
- Other common mistakes

**🧠 Understanding Handles:**
- How handles are generated
- Symbolic execution
- Handle lifecycle

**OpenZeppelin Confidential Contracts:** (can be found in previous versions, needs an upgrade and import of https://github.com/OpenZeppelin/openzeppelin-confidential-contracts lib)
- ERC7984 example
- ERC7984 to ERC20 Wrapper
- Swap ERC7984 to ERC20
- Swap ERC7984 to ERC7984
- Vesting Wallet
- ...

**Advanced Examples:** (can be found in previous versions, need an update)
- Blind Auction

_Or anything else that you can think of_

### 4. **Documentation Strategy**

- Use JSDoc/TSDoc-style comments in TS tests
- Auto-generate markdown README per repo
- Tag key examples into docs: "chapter: access-control", "chapter: relayer", etc.
- Generate GitBook-compatible documentation

**Example Implementation:** See `generate-docs.ts` in the example project for automated documentation generation in TypeScript.

## Bonus points

Earn additional points for:

- **Creative Examples** - Implementing additional examples beyond the requirements
- **Advanced Patterns** - Demonstrating complex FHEVM patterns and use cases
- **Clean Automation** - Particularly elegant and maintainable automation scripts
- **Comprehensive Documentation** - Exceptional documentation with detailed explanations
- **Testing Coverage** - Extensive test coverage including edge cases
- **Error Handling** - Examples demonstrating common pitfalls and how to avoid them
- **Category Organization** - Well-organized categories for different example types
- **Maintenance Tools** - Tools for updating examples when dependencies change

### **Judging criteria**

All submissions **must include a demonstration video** as a mandatory requirement. The video should clearly showcase your project's setup, key features, example execution, and automation scripts in action.

Judging will be based on:

- code quality
- automation completeness
- example quality
- documentation
- ease of maintenance on new version changes
- innovation

### **Deliverables**

Your submission must include:

1. **`base-template/`** - Complete Hardhat template with `@fhevm/solidity`
2. **Automation Scripts** - `create-fhevm-example` and related tools in TypeScript
3. **Example Repositories** - Multiple fully working example repos (or category-based projects)
4. **Documentation** - Auto-generated documentation per example
5. **Developer Guide** - Guide for adding new examples and updating dependencies
6. **Automation Tools** - Complete set of tools for scaffolding and documentation generation

### **Reference Repositories**

Use the following repositories as references:
- Examples and text: https://docs.zama.org/protocol/examples
- Base template: https://github.com/zama-ai/fhevm-hardhat-template
- dApps and hardhat examples (outdated): https://github.com/zama-ai/dapps
- OpenZeppelin's confidential contracts repo: https://github.com/OpenZeppelin/openzeppelin-confidential-contracts
- **Example implementation**: https://github.com/poppyseedDev/zama-bounty-11-example-project

---

### **Rewards**
- 🥇 **1st place:** $5,000
- 🥈 **2nd place**: $3,000
- 🥉 **3rd place**: $2,000


---

## **How to participate?**

Connect your wallet to the Zama Guild and submit your project from [here](https://guild.xyz/zama/developer-program).

---

### **Additional links**

- Zama [Developer Program on Guild](https://guild.xyz/zama/bounty-program)
- Zama [Community Forum](https://www.zama.ai/community) for developer support
- Zama [Discord server](https://discord.com/invite/zama)
- Zama on [X](https://twitter.com/zama_fhe)
- Zama on [Telegram](https://t.me/zama_on_telegram)

---

Good luck with your bounty submission! 🎉
