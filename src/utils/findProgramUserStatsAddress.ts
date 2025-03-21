import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { findProgramUserAddress } from './findProgramUserAddress';

const USER_STATS_SEED = 'user_stats';

export const findProgramUserStatsAddress = (
  programId: PublicKey,
  address: PublicKey
) => {
  const userAccountAddress = findProgramUserAddress(programId, address);
  const [statsPda] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(USER_STATS_SEED),
      userAccountAddress.toBuffer(),
    ],
    programId
  );

  return statsPda;
};
