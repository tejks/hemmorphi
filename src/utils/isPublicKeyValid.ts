import { PublicKey } from '@solana/web3.js';

export const isPublicKeyValid = (publicKey: string): boolean => {
  try {
    new PublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
};
