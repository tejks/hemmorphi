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

export const generateRandomQrData = (address: PublicKey) => {
  const amount = Math.floor(Math.random() * 1000);
  const tokens = TOKENS;
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

const getShortHash = (data: string): string => {
  return sha256(data).toString(CryptoJS.enc.Hex).slice(0, 32);
};
