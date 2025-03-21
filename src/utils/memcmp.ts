import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';

export const getQrAccountFilter = (
  authority: PublicKey
): GetProgramAccountsFilter[] => {
  return [
    {
      memcmp: {
        offset: 8,
        bytes: authority.toBase58(),
      },
    },
  ];
};

export const getAssociatedTokenAccountFilter = (
  owner: PublicKey
): GetProgramAccountsFilter[] => {
  return [
    {
      dataSize: 165,
    },
    {
      memcmp: {
        offset: 32,
        bytes: owner.toBase58(),
      },
    },
  ];
};
