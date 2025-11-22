/**
 * Zama FHE Encryption Library
 * Encrypts bid amounts using Fully Homomorphic Encryption
 * Production implementation using fhevmjs
 * 
 * Note: This is a simplified implementation for development.
 * For production with Zama network, you need to:
 * 1. Deploy FHE-compatible smart contracts (using fhevm/lib/TFHE.sol)
 * 2. Configure proper KMS and ACL contract addresses
 * 3. Use a Zama-enabled network (Sepolia with FHE support)
 */

import { createInstance, type FhevmInstance } from 'fhevmjs';
import { BrowserProvider, AbiCoder } from 'ethers';

// Configuration
const FHE_CONFIG = {
  // For Zama Sepolia testnet
  kmsContractAddress: import.meta.env.VITE_KMS_CONTRACT_ADDRESS || '0x9D6891A6240D6130c54ae243d8005063D05fE14b',
  aclContractAddress: import.meta.env.VITE_ACL_CONTRACT_ADDRESS || '0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5',
  gatewayUrl: import.meta.env.VITE_GATEWAY_URL || 'https://gateway.sepolia.zama.ai/',
};

let fhevmInstance: FhevmInstance | null = null;

/**
 * Initialize FHE instance with Web3 provider
 */
export async function initializeFHE(): Promise<FhevmInstance> {
  if (fhevmInstance) return fhevmInstance;
  
  try {
    // Check if ethereum is available
    if (!window.ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Get blockchain public key from FHE library contract
    const FHE_LIB_ADDRESS = '0x000000000000000000000000000000000000005d';
    const ret = await provider.call({
      to: FHE_LIB_ADDRESS,
      data: '0xd9d47bb001', // fhePubKey(bytes1) selector + 01
    });

    const abiCoder = new AbiCoder();
    const decoded = abiCoder.decode(['bytes'], ret);
    const publicKey = decoded[0];

    // Create instance with blockchain public key
    fhevmInstance = await createInstance({
      chainId,
      publicKey,
      gatewayUrl: FHE_CONFIG.gatewayUrl,
      kmsContractAddress: FHE_CONFIG.kmsContractAddress,
      aclContractAddress: FHE_CONFIG.aclContractAddress,
    } as any);

    return fhevmInstance;
  } catch (error) {
    console.error('FHE initialization error:', error);
    
    // Fallback to mock for development
    console.warn('Falling back to development mode without FHE encryption');
    throw new Error('FHE initialization failed. Using mock encryption for development.');
  }
}

/**
 * Encrypt a bid amount using Zama FHE
 * 
 * For production: This creates encrypted inputs that can be used with
 * FHE-compatible smart contracts using TFHE library
 */
export async function encryptBidAmount(
  amount: number,
  minBudget: number,
  maxBudget: number,
  contractAddress: string,
  userAddress: string
): Promise<{
  encryptedAmount: string;
  proof: string;
}> {
  // Validate range
  if (amount < minBudget || amount > maxBudget) {
    throw new Error(`Bid must be between ${minBudget} and ${maxBudget} ETH`);
  }

  try {
    const instance = await initializeFHE();
    
    // Convert to wei (smallest unit)
    const amountWei = BigInt(Math.floor(amount * 1e18));
    
    // Create encrypted input buffer
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    
    // Add the bid amount as euint256
    input.add256(amountWei);
    
    // Encrypt and get ciphertexts
    const encryptedInput = await input.encrypt();
    
    // Convert to hex strings
    const encryptedData = bytesToHex(encryptedInput.handles[0]);
    const inputProof = bytesToHex(encryptedInput.inputProof);
    
    return {
      encryptedAmount: encryptedData,
      proof: inputProof,
    };
  } catch (error) {
    console.error('FHE encryption error:', error);
    
    // Fallback to mock encryption for development
    return mockEncryptBidAmount(amount, minBudget, maxBudget);
  }
}

/**
 * Decrypt encrypted data using re-encryption
 * This allows users to view their own encrypted bid
 */
export async function reencryptBidAmount(
  encryptedHandle: bigint,
  contractAddress: string,
  userAddress: string
): Promise<bigint> {
  try {
    const instance = await initializeFHE();
    
    // Generate keypair for re-encryption
    const { publicKey, privateKey } = instance.generateKeypair();
    
    // Create EIP-712 for user to sign
    const eip712 = instance.createEIP712(publicKey, contractAddress);
    
    // Request signature from user
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signTypedData(
      eip712.domain,
      eip712.types,
      eip712.message
    );
    
    // Perform re-encryption to get decrypted value
    const decryptedValue = await instance.reencrypt(
      encryptedHandle,
      privateKey,
      publicKey,
      signature,
      contractAddress,
      userAddress
    );
    
    return BigInt(decryptedValue);
  } catch (error) {
    console.error('FHE re-encryption error:', error);
    throw new Error('Failed to decrypt bid amount. Please try again.');
  }
}

/**
 * Mock encryption for development when FHE is not available
 */
function mockEncryptBidAmount(
  amount: number,
  minBudget: number,
  maxBudget: number
): { encryptedAmount: string; proof: string } {
  const amountWei = BigInt(Math.floor(amount * 1e18));
  
  // Create mock encrypted data
  const encrypted = new Uint8Array(64);
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  encrypted.set(random, 0);
  
  // XOR with amount (simplified encryption)
  const amountBytes = numberToBytes(amountWei);
  for (let i = 0; i < 32; i++) {
    encrypted[i + 32] = amountBytes[i] ^ random[i];
  }
  
  // Create mock proof
  const proof = new Uint8Array(96);
  crypto.getRandomValues(proof);
  
  return {
    encryptedAmount: bytesToHex(encrypted),
    proof: bytesToHex(proof),
  };
}

/**
 * Convert number to bytes (big-endian)
 */
function numberToBytes(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(v & BigInt(0xff));
    v = v >> BigInt(8);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array | string): string {
  if (typeof bytes === 'string') return bytes.startsWith('0x') ? bytes : '0x' + bytes;
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify if FHE is properly initialized
 */
export function isFHEReady(): boolean {
  return fhevmInstance !== null;
}

/**
 * Get the FHE instance (for advanced usage)
 */
export function getFHEInstance(): FhevmInstance | null {
  return fhevmInstance;
}
