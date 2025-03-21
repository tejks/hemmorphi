import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export const checkATAExists = async (
  walletAddress: PublicKey,
  mintAddress: PublicKey,
  connection: Connection
) => {
  try {
    const ataAddress = await getAssociatedTokenAddress(
      mintAddress,
      walletAddress
    );

    const accountInfo = await connection.getAccountInfo(ataAddress);
    const exists = accountInfo !== null;

    return exists;
  } catch {
    return false;
  }
};
