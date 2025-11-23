# Zama Season 11 Bounty: FHEVM Example Repositories

## 🎯 **Bounty Goal**

Build a set of standalone, Hardhat-based FHEVM example repositories, each demonstrating one clear concept (e.g., access control, public decryption, user decryption), with clean tests, automated scaffolding, and self-contained documentation.

## 📚 **Example Project**

A starter example implementation of this bounty can be found here:
**https://github.com/poppyseedDev/zama-bounty-11-example-project**

This repository demonstrates:
- Automated scaffolding tools for generating example repositories
- Documentation generation from code annotations
- Category-based project generation
- Complete implementation of the bounty requirements

---

## 🧠 **Bounty Breakdown and Developer Approach**

### 1. **Project Structure & Simplicity**

- **Use only Hardhat** for all examples
- **One repo per example**, no monorepo
- Keep each repo minimal: `contracts/`, `test/`, `hardhat.config.ts`, etc.
- Use a shared `base-template` that can be cloned/scaffolded
- Generate documentation like seen in https://github.com/zama-ai/fhevm/tree/main/docs/examples relates to page https://docs.zama.org/protocol/examples/

---

### 2. **Scaffolding / Automation**

Create a CLI or script (`create-fhevm-example`) to:
- Clone and customize the base Hardhat template - https://github.com/zama-ai/fhevm-hardhat-template
- Insert a specific Solidity contract into `contracts/`
- Generate matching tests
- Auto-generate documentation from annotations in code

**Example Implementation:** See the example project for working `create-fhevm-example.ts` and `create-fhevm-category.ts` scripts written in TypeScript.

---

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
- Public decryption async mechanism

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

**OpenZeppelin Confidential Contracts:** (find in the previous versions, need an upgrade and import of https://github.com/OpenZeppelin/openzeppelin-confidential-contracts lib)
- ERC7984 example
- ERC7984 to ERC20 Wrapper
- Swap ERC7984 to ERC20
- Swap ERC7984 to ERC7984
- Vesting Wallet

**Advanced Examples:** (can be found in previous versions, need an update)
- Blind Auction
- 

_Or anything else that you can think of_


---

### 5. **Documentation Strategy**

- Use JSDoc/TSDoc-style comments in TS tests
- Auto-generate markdown README per repo
- Tag key examples into docs: "chapter: access-control", "chapter: relayer", etc.
- Generate GitBook-compatible documentation

**Example Implementation:** See `generate-docs.ts` in the example project for automated documentation generation in TypeScript.

---

### 6. **Reference Repositories**

Use the following repositories as references:
- Examples and text: https://docs.zama.org/protocol/examples
- Base template: https://github.com/zama-ai/fhevm-hardhat-template
- dApps and hardhat examples (outdated): https://github.com/zama-ai/dapps
- OpenZeppelin's confidential contracts repo: https://github.com/OpenZeppelin/openzeppelin-confidential-contracts
- **Example implementation**: https://github.com/poppyseedDev/zama-bounty-11-example-project

---

## ✅ **Deliverables for the Bounty**

1. **`base-template/`** for Hardhat with `@fhevm/solidity`
2. **Script**: `create-fhevm-example <example-name>`
3. **Fully working example repos** (or category-based projects)
4. **Documentation** auto-generated per example
5. **Guide** for adding new examples and updating deps
6. **Automation tools** for scaffolding and documentation generation

---

## 🚀 **Getting Started**

Check out the example implementation at https://github.com/poppyseedDev/zama-bounty-11-example-project to see:
- How to structure your automation scripts
- Example contract and test patterns
- Documentation generation workflow
- Category-based project generation

Good luck with your bounty submission! 🎉
