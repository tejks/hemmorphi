import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export type QrAccountWithPubkey = {
  publicKey: PublicKey;
  data: QrAccountData;
};

export type QrAccountData = {
  amount: BN;
  authority: PublicKey;
  bump: number;
  hash: string;
  lastTransferTimestamp: BN;
  tokens: PublicKey[];
  tokensStats: {
    transferCount: BN;
    totalAmount: BN;
    totalValue: BN;
  }[];
};

export type QrAccountJsonWithPubkey = {
  publicKey: string;
  data: QrAccountJson;
};

export type QrAccountJson = {
  amount: string;
  authority: string;
  bump: number;
  hash: string;
  lastTransferTimestamp: string;
  tokens: string[];
  tokensStats: {
    transferCount: string;
    totalAmount: string;
    totalValue: string;
  }[];
};

export class QrAccount {
  static fromJsonWithPubkey(
    json: QrAccountJsonWithPubkey
  ): QrAccountWithPubkey {
    return {
      publicKey: new PublicKey(json.publicKey),
      data: QrAccount.fromJson(json.data),
    };
  }

  static fromJson(json: QrAccountJson): QrAccountData {
    return {
      amount: new BN(json.amount),
      authority: new PublicKey(json.authority),
      bump: json.bump,
      hash: json.hash,
      lastTransferTimestamp: new BN(json.lastTransferTimestamp),
      tokens: json.tokens.map((token) => new PublicKey(token)),
      tokensStats: json.tokensStats.map((stats) => ({
        transferCount: new BN(stats.transferCount),
        totalAmount: new BN(stats.totalAmount),
        totalValue: new BN(stats.totalValue),
      })),
    };
  }

  static toJsonWithPubkey(
    qrAccount: QrAccountWithPubkey
  ): QrAccountJsonWithPubkey {
    return {
      publicKey: qrAccount.publicKey.toString(),
      data: QrAccount.toJson(qrAccount.data),
    };
  }

  static toJson(qrAccount: QrAccountData): QrAccountJson {
    return {
      amount: qrAccount.amount.toString(),
      authority: qrAccount.authority.toBase58(),
      bump: qrAccount.bump,
      hash: qrAccount.hash,
      lastTransferTimestamp: qrAccount.lastTransferTimestamp.toString(),
      tokens: qrAccount.tokens.map((token) => token.toBase58()),
      tokensStats: qrAccount.tokensStats.map((stats) => ({
        transferCount: stats.transferCount.toString(),
        totalAmount: stats.totalAmount.toString(),
        totalValue: stats.totalValue.toString(),
      })),
    };
  }
}
