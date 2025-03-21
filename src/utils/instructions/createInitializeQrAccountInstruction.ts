import { BN, Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Hemmorphi } from 'contract/target/types/hemmorphi';

export const createInitializeQrAccountInstruction = async (
  program: Program<Hemmorphi>,
  authority: PublicKey,
  qrData: { hash: string; amount: BN; tokens: PublicKey[] }
): Promise<TransactionInstruction> => {
  return await program.methods
    .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
    .accounts({
      authority,
    })
    .instruction();
};
