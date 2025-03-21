import { Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Hemmorphi } from 'contract/target/types/hemmorphi';

export const createInitializeUserAccountInstruction = async (
  program: Program<Hemmorphi>,
  authority: PublicKey,
  name: string
): Promise<TransactionInstruction> => {
  return await program.methods
    .initializeUser(name)
    .accounts({
      authority,
    })
    .instruction();
};
