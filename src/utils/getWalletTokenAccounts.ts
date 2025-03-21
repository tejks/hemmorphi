import { Account, TOKEN_PROGRAM_ID, unpackAccount } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export async function getWalletTokenAccounts(
  wallet: PublicKey,
  connection: Connection
): Promise<Account[]> {
  const accounts = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });

  return accounts.value.map((account) => {
    return unpackAccount(account.pubkey, account.account);
  });
}
