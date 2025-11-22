// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, ebool, euint32, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PublicDecryptMultipleValues is ZamaEthereumConfig {
  ebool private _encryptedBool; // = 0 (uninitialized)
  euint32 private _encryptedUint32; // = 0 (uninitialized)
  euint64 private _encryptedUint64; // = 0 (uninitialized)

  bool private _clearBool; // = 0 (uninitialized)
  uint32 private _clearUint32; // = 0 (uninitialized)
  uint64 private _clearUint64; // = 0 (uninitialized)

  // solhint-disable-next-line no-empty-blocks
  constructor() {}

  function initialize(bool a, uint32 b, uint64 c) external {
    // Compute 3 trivial FHE formulas

    // _encryptedBool = a ^ false
    _encryptedBool = FHE.xor(FHE.asEbool(a), FHE.asEbool(false));

    // _encryptedUint32 = b + 1
    _encryptedUint32 = FHE.add(FHE.asEuint32(b), FHE.asEuint32(1));

    // _encryptedUint64 = c + 1
    _encryptedUint64 = FHE.add(FHE.asEuint64(c), FHE.asEuint64(1));

    // Make the encrypted values publicly decryptable.
    // This allows anyone to decrypt the values by providing valid decryption proofs.
    FHE.makePubliclyDecryptable(_encryptedBool);
    FHE.makePubliclyDecryptable(_encryptedUint32);
    FHE.makePubliclyDecryptable(_encryptedUint64);
  }

  /**
   * @notice Returns the encrypted ebool handle.
   * @return The encrypted bool value (ebool handle).
   */
  function getEncryptedBool() public view returns (ebool) {
    return _encryptedBool;
  }

  /**
   * @notice Returns the encrypted euint32 handle.
   * @return The encrypted uint32 value (euint32 handle).
   */
  function getEncryptedUint32() public view returns (euint32) {
    return _encryptedUint32;
  }

  /**
   * @notice Returns the encrypted euint64 handle.
   * @return The encrypted uint64 value (euint64 handle).
   */
  function getEncryptedUint64() public view returns (euint64) {
    return _encryptedUint64;
  }

  /**
   * @notice Verifies the provided (decryption proof, ABI-encoded clear values) pair against the stored ciphertexts,
   *         and then stores the decrypted values.
   * @param abiEncodedClearValues The ABI-encoded clear values (bool, uint32, uint64) associated to the `decryptionProof`.
   *                              The order must match: (bool, uint32, uint64).
   * @param decryptionProof The proof that validates the decryption.
   * 
   * @dev ⚠️ WARNING: The order of values in the ciphertext array is critical!
   *      The order must match the ABI encoding order: (bool, uint32, uint64).
   *      These values' types must match exactly! Mismatched types—such as using `uint32` 
   *      instead of the correct `uint64` can cause subtle and hard-to-detect bugs.
   *      Always ensure that the parameter types align with the expected decrypted value types.
   */
  function recordAndVerifyDecryption(
    bytes memory abiEncodedClearValues,
    bytes memory decryptionProof
  ) public {
    // 1. FHE Verification: Build the list of ciphertexts (handles) and verify the proof.
    //    The verification checks that 'abiEncodedClearValues' is the true decryption
    //    of the encrypted handles using the provided 'decryptionProof'.
    //
    // ⚠️ Warning: The order of values in the array is critical!
    // The order must match the ABI encoding order in abiEncodedClearValues: (bool, uint32, uint64).
    bytes32[] memory cts = new bytes32[](3);
    cts[0] = FHE.toBytes32(_encryptedBool);
    cts[1] = FHE.toBytes32(_encryptedUint32);
    cts[2] = FHE.toBytes32(_encryptedUint64);

    // This FHE call reverts the transaction if the decryption proof is invalid.
    FHE.checkSignatures(
      cts,
      abiEncodedClearValues,
      decryptionProof
    );

    // 2. Decode the clear results and store them.
    // The order must match the ciphertext array order: (bool, uint32, uint64).
    (bool decryptedBool, uint32 decryptedUint32, uint64 decryptedUint64) = 
      abi.decode(abiEncodedClearValues, (bool, uint32, uint64));
    _clearBool = decryptedBool;
    _clearUint32 = decryptedUint32;
    _clearUint64 = decryptedUint64;
  }

  function clearBool() public view returns (bool) {
    return _clearBool;
  }

  function clearUint32() public view returns (uint32) {
    return _clearUint32;
  }

  function clearUint64() public view returns (uint64) {
    return _clearUint64;
  }
}