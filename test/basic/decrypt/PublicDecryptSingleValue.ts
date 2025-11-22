import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers as EthersT } from "ethers";
import { ethers, fhevm } from "hardhat";
import * as hre from "hardhat";

import { PublicDecryptSingleValue, PublicDecryptSingleValue__factory } from "../../../types";

type Signers = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const factory = (await ethers.getContractFactory(
    "PublicDecryptSingleValue",
  )) as PublicDecryptSingleValue__factory;
  const publicDecryptSingleValue = (await factory.deploy()) as PublicDecryptSingleValue;
  const publicDecryptSingleValue_address = await publicDecryptSingleValue.getAddress();

  return { publicDecryptSingleValue, publicDecryptSingleValue_address };
}

/**
 * This trivial example demonstrates the FHE public decryption mechanism
 * using the synchronous makePubliclyDecryptable pattern.
 */
describe("PublicDecryptSingleValue", function () {
  let contract: PublicDecryptSingleValue;
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
    contractAddress = deployment.publicDecryptSingleValue_address;
    contract = deployment.publicDecryptSingleValue;
  });

  // ✅ Test should succeed
  it("decryption should succeed", async function () {
    console.log(``);
    console.log(`🔢 PublicDecryptSingleValue contract address: ${contractAddress}`);
    console.log(`   👤 alice.address: ${signers.alice.address}`);
    console.log(``);

    const inputValue = 123456;
    const expectedValue = inputValue + 1; // The contract adds 1 to the input

    // Initialize the contract with a value
    const tx = await contract.connect(signers.alice).initializeUint32(inputValue);
    await tx.wait();

    // Get the encrypted handle
    const encryptedUint32 = await contract.getEncryptedUint32();
    const encryptedUint32String = encryptedUint32.toString();

    console.log(`✅ Contract initialized with value: ${inputValue}`);
    console.log(`   Encrypted handle: ${encryptedUint32String}`);

    // Call the Zama Relayer to compute the decryption
    const publicDecryptResults = await fhevm.publicDecrypt([encryptedUint32String]);

    // The Relayer returns a `PublicDecryptResults` object containing:
    // - the ORDERED clear values
    // - the ORDERED clear values in ABI-encoded form
    // - the KMS decryption proof associated with the ORDERED clear values in ABI-encoded form
    const abiEncodedClearValue = publicDecryptResults.abiEncodedClearValues;
    const decryptionProof = publicDecryptResults.decryptionProof;

    // Let's forward the `PublicDecryptResults` content to the on-chain contract whose job
    // will simply be to verify the proof and store the decrypted value
    await contract.recordAndVerifyDecryption(abiEncodedClearValue, decryptionProof);

    const clearUint32 = await contract.clearUint32();

    expect(clearUint32).to.equal(expectedValue);

    console.log(`✅ Decrypted value: ${clearUint32} (expected: ${expectedValue})`);
    console.log(``);
  });

  // ❌ The test must fail if the decryption proof is invalid
  it("should fail when the decryption proof is invalid", async function () {
    const inputValue = 123456;
    const tx = await contract.connect(signers.alice).initializeUint32(inputValue);
    await tx.wait();

    const encryptedUint32 = await contract.getEncryptedUint32();
    const encryptedUint32String = encryptedUint32.toString();

    const publicDecryptResults = await fhevm.publicDecrypt([encryptedUint32String]);
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
  // with a forged value.
  it("should fail when using a decryption proof with a forged value", async function () {
    const inputValue = 123456;
    const tx = await contract.connect(signers.alice).initializeUint32(inputValue);
    await tx.wait();

    const encryptedUint32 = await contract.getEncryptedUint32();
    const encryptedUint32String = encryptedUint32.toString();

    const publicDecryptResults = await fhevm.publicDecrypt([encryptedUint32String]);
    const clearValue = publicDecryptResults.clearValues[encryptedUint32String];

    // The clear value is also ABI-encoded
    const decodedValue = EthersT.AbiCoder.defaultAbiCoder().decode(
      ["uint32"],
      publicDecryptResults.abiEncodedClearValues,
    )[0];
    expect(decodedValue).to.eq(clearValue);

    // Let's try to forge the value
    const forgedValue = (decodedValue as bigint) + BigInt(1000);
    const forgedABIEncodedClearValues = EthersT.AbiCoder.defaultAbiCoder().encode(["uint32"], [forgedValue]);

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
});