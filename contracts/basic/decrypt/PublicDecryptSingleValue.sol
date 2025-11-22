// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PublicDecryptSingleValue is ZamaEthereumConfig {
  euint32 private _encryptedUint32; // = 0 (uninitizalized)
  uint32 private _clearUint32; // = 0 (uninitizalized)

  // solhint-disable-next-line no-empty-blocks
  constructor() {}

  function initializeUint32(uint32 value) external {
    // Compute a trivial FHE formula _encryptedUint32 = value + 1
    _encryptedUint32 = FHE.add(FHE.asEuint32(value), FHE.asEuint32(1));

    // Make the encrypted value publicly decryptable.
    // This allows anyone to decrypt the value by providing a valid decryption proof.
    FHE.makePubliclyDecryptable(_encryptedUint32);
  }

  /**
   * @notice Returns the encrypted euint32 handle.
   * @return The encrypted value (euint32 handle).
   */
  function getEncryptedUint32() public view returns (euint32) {
    return _encryptedUint32;
  }

  /**
   * @notice Verifies the provided (decryption proof, ABI-encoded clear value) pair against the stored ciphertext,
   *         and then stores the decrypted value.
   * @param abiEncodedClearValue The ABI-encoded clear value (uint32) associated to the `decryptionProof`.
   * @param decryptionProof The proof that validates the decryption.
   */
  function recordAndVerifyDecryption(
    bytes memory abiEncodedClearValue,
    bytes memory decryptionProof
  ) public {
    // 1. FHE Verification: Build the list of ciphertexts (handles) and verify the proof.
    //    The verification checks that 'abiEncodedClearValue' is the true decryption
    //    of the '_encryptedUint32' handle using the provided 'decryptionProof'.

    // Creating the list of handles in the right order!
    // In this case the order does not matter since the proof only involves 1 handle.
    bytes32[] memory cts = new bytes32[](1);
    cts[0] = FHE.toBytes32(_encryptedUint32);

    // This FHE call reverts the transaction if the decryption proof is invalid.
    FHE.checkSignatures(
      cts,
      abiEncodedClearValue,
      decryptionProof
    );

    // 2. Decode the clear result and store it.
    uint32 decodedClearValue = abi.decode(abiEncodedClearValue, (uint32));
    _clearUint32 = decodedClearValue;
  }

  function clearUint32() public view returns (uint32) {
    return _clearUint32;
  }
}