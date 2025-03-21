import { Connection, PublicKey } from '@solana/web3.js';

export async function getWalletBalance(
  wallet: PublicKey,
  connection: Connection
): Promise<number> {
  return await connection.getBalance(wallet);
}
