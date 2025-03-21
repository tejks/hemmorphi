import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

const USER_SEED = 'user';

export const findProgramUserAddress = (
  programId: PublicKey,
  address: PublicKey
) => {
  const [userAddress] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode(USER_SEED), address.toBuffer()],
    programId
  );

  return userAddress;
};
