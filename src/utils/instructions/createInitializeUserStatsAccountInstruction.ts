import { Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Hemmorphi } from 'contract/target/types/hemmorphi';

export const createInitializeUserStatsAccountInstruction = async (
  program: Program<Hemmorphi>,
  authority: PublicKey
): Promise<TransactionInstruction> => {
  return await program.methods
    .initializeUserStats()
    .accounts({
      authority,
    })
    .instruction();
};
