import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import sha256 from 'crypto-js/sha256';

export const TOKENS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
  'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA',
  'So11111111111111111111111111111111111111112',
].map((t) => new PublicKey(t));

export const generateRandomQrData = (address: PublicKey, token?: PublicKey) => {
  const amount = Math.floor(Math.random() * 1000);
  const tokens = TOKENS.slice(0, Math.floor(Math.random() * 5));
  if (token) tokens[0] = token;
  const hash = findQrHash(address, amount, tokens);

  return {
    hash,
    amount: new anchor.BN(amount),
    tokens,
  };
};

export const findQrHash = (
  address: PublicKey,
  amount: number,
  tokens: PublicKey[]
) =>
  getShortHash(
    JSON.stringify({
      address,
      amount,
      tokens,
    })
  ).toString();

export const findUserAccountAddress = (
  programId: PublicKey,
  address: PublicKey
) => {
  const [userPda] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode('user'), address.toBuffer()],
    programId
  );

  return userPda;
};

export const findQrAccountAddress = (
  programId: PublicKey,
  address: PublicKey,
  hash: string
) => {
  const [qrPda] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('qr'),
      address.toBuffer(),
      anchor.utils.bytes.utf8.encode(hash),
    ],
    programId
  );

  return qrPda;
};

export const findUserStatsAccountAddress = (
  programId: PublicKey,
  address: PublicKey
) => {
  const [statsPda] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode('user_stats'), address.toBuffer()],
    programId
  );

  return statsPda;
};

const getShortHash = (data: string): string => {
  return sha256(data).toString(CryptoJS.enc.Hex).slice(0, 32);
};

export const getQrAccountFilter = (authority: PublicKey) => {
  return [
    {
      memcmp: {
        offset: 8,
        bytes: authority.toBase58(),
      },
    },
  ];
};
