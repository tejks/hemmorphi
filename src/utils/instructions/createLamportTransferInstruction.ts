import { BN, Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Hemmorphi } from 'contract/target/types/hemmorphi';
import { findProgramUserStatsAddress } from '../findProgramUserStatsAddress';

export const createLamportTransferInstruction = async (
  program: Program<Hemmorphi>,
  sourcePublicKey: PublicKey,
  destinationPublicKey: PublicKey,
  amount: BN,
  qrAccountAddress: PublicKey
): Promise<TransactionInstruction> => {
  const userStatsAddress = findProgramUserStatsAddress(
    program.programId,
    destinationPublicKey
  );

  const instruction = await program.methods
    .qrTransferLamports(amount)
    .accounts({
      qrAccount: qrAccountAddress,
      userStats: userStatsAddress,
      from: sourcePublicKey,
      to: destinationPublicKey,
    })
    .instruction();

  return instruction;
};
