import { QrAccountData, QrAccountWithPubkey } from '@/model/QrAccount';
import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { Hemmorphi } from 'contract/target/types/hemmorphi';
import { getQrAccountFilter } from './memcmp';

export const getQrAccountsByAuthority = async (
  connection: Connection,
  program: Program<Hemmorphi>,
  user: PublicKey
): Promise<QrAccountWithPubkey[]> => {
  const accounts = await connection.getProgramAccounts(program.programId, {
    filters: getQrAccountFilter(user),
  });

  return accounts.map(({ pubkey, account }) => {
    const decoded = program.coder.accounts.decodeUnchecked<QrAccountData>(
      'qrAccount',
      account.data
    );

    return {
      publicKey: pubkey,
      data: decoded,
    };
  });
};
