import { BN, Program } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Hemmorphi } from 'contract/target/types/hemmorphi';
import { findProgramUserStatsAddress } from '../findProgramUserStatsAddress';

export const createSplTransferInstruction = async (
  program: Program<Hemmorphi>,
  sourcePublicKey: PublicKey,
  destinationPublicKey: PublicKey,
  mint: PublicKey,
  amount: BN,
  qrAccountAddress: PublicKey
): Promise<TransactionInstruction> => {
  const fromUserAssociatedTokenAccount = await getAssociatedTokenAddress(
    mint,
    sourcePublicKey
  );
  const toUserAssociatedTokenAccount = await getAssociatedTokenAddress(
    mint,
    destinationPublicKey
  );
  const userStatsAddress = findProgramUserStatsAddress(
    program.programId,
    destinationPublicKey
  );

  const instruction = await program.methods
    .qrTransferSpl(amount)
    .accounts({
      qrAccount: qrAccountAddress,
      userStats: userStatsAddress,
      from: sourcePublicKey,
      source: fromUserAssociatedTokenAccount,
      destination: toUserAssociatedTokenAccount,
    })
    .instruction();

  return instruction;
};
