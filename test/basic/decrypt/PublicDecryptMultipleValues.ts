import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers as EthersT } from "ethers";
import { ethers, fhevm } from "hardhat";
import * as hre from "hardhat";

import { PublicDecryptMultipleValues, PublicDecryptMultipleValues__factory } from "../../../types";

type Signers = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const factory = (await ethers.getContractFactory(
    "PublicDecryptMultipleValues",
  )) as PublicDecryptMultipleValues__factory;
  const publicDecryptMultipleValues = (await factory.deploy()) as PublicDecryptMultipleValues;
  const publicDecryptMultipleValues_address = await publicDecryptMultipleValues.getAddress();

  return { publicDecryptMultipleValues, publicDecryptMultipleValues_address };
}

/**
 * This trivial example demonstrates the FHE public decryption mechanism
 * using the synchronous makePubliclyDecryptable pattern with multiple values.
 */
describe("PublicDecryptMultipleValues", function () {
  let contract: PublicDecryptMultipleValues;
  let contractAddress: string;
  let signers: Signers;

  before(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Deploy a new contract each time we run a new test
    const deployment = await deployFixture();
    contractAddress = deployment.publicDecryptMultipleValues_address;
    contract = deployment.publicDecryptMultipleValues;
  });

  // ✅ Test should succeed
  it("decryption should succeed", async function () {
    console.log(``);
    console.log(`🔢 PublicDecryptMultipleValues contract address: ${contractAddress}`);
    console.log(`   👤 alice.address: ${signers.alice.address}`);
    console.log(``);

    const inputBool = true;
    const inputUint32 = 123456;
    const inputUint64 = 78901234567;

    const expectedBool = inputBool; // a ^ false = a
    const expectedUint32 = inputUint32 + 1; // b + 1
    const expectedUint64 = inputUint64 + 1; // c + 1

    // Initialize the contract with values
    const tx = await contract.connect(signers.alice).initialize(inputBool, inputUint32, inputUint64);
    await tx.wait();

    // Get the encrypted handles in the correct order: (bool, uint32, uint64)
    const encryptedBool = await contract.getEncryptedBool();
    const encryptedUint32 = await contract.getEncryptedUint32();
    const encryptedUint64 = await contract.getEncryptedUint64();

    const encryptedBoolString = encryptedBool.toString();
    const encryptedUint32String = encryptedUint32.toString();
    const encryptedUint64String = encryptedUint64.toString();

    console.log(`✅ Contract initialized with values:`);
    console.log(`   bool: ${inputBool}, uint32: ${inputUint32}, uint64: ${inputUint64}`);

    // Call the Zama Relayer to compute the decryption
    // ⚠️ The order is critical: must match (bool, uint32, uint64)
    const publicDecryptResults = await fhevm.publicDecrypt([
      encryptedBoolString,
      encryptedUint32String,
      encryptedUint64String,
    ]);

    // The Relayer returns a `PublicDecryptResults` object containing:
    // - the ORDERED clear values
    // - the ORDERED clear values in ABI-encoded form
    // - the KMS decryption proof associated with the ORDERED clear values in ABI-encoded form
    const abiEncodedClearValues = publicDecryptResults.abiEncodedClearValues;
    const decryptionProof = publicDecryptResults.decryptionProof;

    // Let's forward the `PublicDecryptResults` content to the on-chain contract whose job
    // will simply be to verify the proof and store the decrypted values
    await contract.recordAndVerifyDecryption(abiEncodedClearValues, decryptionProof);

    const clearBool = await contract.clearBool();
    const clearUint32 = await contract.clearUint32();
    const clearUint64 = await contract.clearUint64();

    expect(clearBool).to.equal(expectedBool);
    expect(clearUint32).to.equal(expectedUint32);
    expect(clearUint64).to.equal(expectedUint64);

    console.log(`✅ Decrypted values:`);
    console.log(`   bool: ${clearBool} (expected: ${expectedBool})`);
    console.log(`   uint32: ${clearUint32} (expected: ${expectedUint32})`);
    console.log(`   uint64: ${clearUint64} (expected: ${expectedUint64})`);
    console.log(``);
  });

  // ❌ The test must fail if the decryption proof is invalid
  it("should fail when the decryption proof is invalid", async function () {
    const tx = await contract.connect(signers.alice).initialize(true, 123456, 78901234567);
    await tx.wait();

    const encryptedBool = await contract.getEncryptedBool();
    const encryptedUint32 = await contract.getEncryptedUint32();
    const encryptedUint64 = await contract.getEncryptedUint64();

    const publicDecryptResults = await fhevm.publicDecrypt([
      encryptedBool.toString(),
      encryptedUint32.toString(),
      encryptedUint64.toString(),
    ]);

    await expect(
      contract.recordAndVerifyDecryption(
        publicDecryptResults.abiEncodedClearValues,
        publicDecryptResults.decryptionProof + "dead",
      ),
    ).to.be.revertedWithCustomError(
      { interface: new EthersT.Interface(["error KMSInvalidSigner(address invalidSigner)"]) },
      "KMSInvalidSigner",
    );
  });

  // ❌ The test must fail if a malicious operator attempts to use a decryption proof
  // with forged values.
  it("should fail when using a decryption proof with forged values", async function () {
    const tx = await contract.connect(signers.alice).initialize(true, 123456, 78901234567);
    await tx.wait();

    const encryptedBool = await contract.getEncryptedBool();
    const encryptedUint32 = await contract.getEncryptedUint32();
    const encryptedUint64 = await contract.getEncryptedUint64();

    const encryptedBoolString = encryptedBool.toString();
    const encryptedUint32String = encryptedUint32.toString();
    const encryptedUint64String = encryptedUint64.toString();

    const publicDecryptResults = await fhevm.publicDecrypt([
      encryptedBoolString,
      encryptedUint32String,
      encryptedUint64String,
    ]);

    // The clear values are also ABI-encoded
    const decodedValues = EthersT.AbiCoder.defaultAbiCoder().decode(
      ["bool", "uint32", "uint64"],
      publicDecryptResults.abiEncodedClearValues,
    );
    const [decodedBool, decodedUint32, decodedUint64] = decodedValues;

    expect(decodedBool).to.eq(publicDecryptResults.clearValues[encryptedBoolString]);
    expect(decodedUint32).to.eq(publicDecryptResults.clearValues[encryptedUint32String]);
    expect(decodedUint64).to.eq(publicDecryptResults.clearValues[encryptedUint64String]);

    // Let's try to forge the values
    const forgedBool = !decodedBool;
    const forgedUint32 = (decodedUint32 as bigint) + BigInt(1000);
    const forgedUint64 = (decodedUint64 as bigint) + BigInt(2000);
    const forgedABIEncodedClearValues = EthersT.AbiCoder.defaultAbiCoder().encode(
      ["bool", "uint32", "uint64"],
      [forgedBool, forgedUint32, forgedUint64],
    );

    await expect(
      contract.recordAndVerifyDecryption(
        forgedABIEncodedClearValues,
        publicDecryptResults.decryptionProof,
      ),
    ).to.be.revertedWithCustomError(
      { interface: new EthersT.Interface(["error KMSInvalidSigner(address invalidSigner)"]) },
      "KMSInvalidSigner",
    );
  });

  // ❌ The test must fail if the order of encrypted handles is wrong
  it("should fail when using encrypted handles in wrong order", async function () {
    const tx = await contract.connect(signers.alice).initialize(true, 123456, 78901234567);
    await tx.wait();

    const encryptedBool = await contract.getEncryptedBool();
    const encryptedUint32 = await contract.getEncryptedUint32();
    const encryptedUint64 = await contract.getEncryptedUint64();

    // Wrong order: (uint32, bool, uint64) instead of (bool, uint32, uint64)
    const publicDecryptResults = await fhevm.publicDecrypt([
      encryptedUint32.toString(),
      encryptedBool.toString(),
      encryptedUint64.toString(),
    ]);

    // The decryption will succeed, but the ABI encoding will be wrong
    // The contract expects (bool, uint32, uint64) but we're providing (uint32, bool, uint64)
    // This will cause a mismatch when verifying the proof
    await expect(
      contract.recordAndVerifyDecryption(
        publicDecryptResults.abiEncodedClearValues,
        publicDecryptResults.decryptionProof,
      ),
    ).to.be.revertedWithCustomError(
      { interface: new EthersT.Interface(["error KMSInvalidSigner(address invalidSigner)"]) },
      "KMSInvalidSigner",
    );
  });
});