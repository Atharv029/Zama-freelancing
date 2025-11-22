import { ethers } from 'ethers';

/**
 * Generate a random secret for bid commitment
 */
export function generateSecret(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Create a commitment hash for a bid
 * commitment = keccak256(abi.encodePacked(amount, secret))
 */
export function createCommitment(amountWei: bigint, secret: string): string {
  const encoded = ethers.solidityPacked(
    ['uint256', 'bytes32'],
    [amountWei, secret]
  );
  return ethers.keccak256(encoded);
}

/**
 * Store bid secret locally (for later reveal)
 */
export function storeBidSecret(projectId: number, secret: string, amount: string): void {
  const key = `bid_${projectId}`;
  localStorage.setItem(key, JSON.stringify({ secret, amount }));
}

/**
 * Retrieve bid secret from local storage
 */
export function getBidSecret(projectId: number): { secret: string; amount: string } | null {
  const key = `bid_${projectId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Hash proposal text
 */
export function hashProposal(proposal: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(proposal));
}

/**
 * Store proposal text locally (for later viewing by winner)
 */
export function storeProposal(projectId: number, address: string, proposal: string): void {
  const key = `proposal_${projectId}_${address.toLowerCase()}`;
  localStorage.setItem(key, proposal);
}

/**
 * Retrieve proposal text from local storage
 */
export function getProposal(projectId: number, address: string): string | null {
  const key = `proposal_${projectId}_${address.toLowerCase()}`;
  return localStorage.getItem(key);
}
