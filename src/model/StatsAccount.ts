import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export type UserStatsAccountWithPubkey = {
  publicKey: PublicKey;
  data: UserStatsAccountData;
};

export type UserStatsAccountData = {
  authority: PublicKey;
  qrCodesCreated: BN;
  totalTransfers: BN;
  totalValueTransfered: BN;
  lastActiveTimestamp: BN;
  bump: number;
};

export type UserStatsAccountJsonWithPubkey = {
  publicKey: string;
  data: UserStatsAccountJson;
};

export type UserStatsAccountJson = {
  authority: string;
  qrCodesCreated: string;
  totalTransfers: string;
  totalValueTransfered: string;
  lastActiveTimestamp: string;
  bump: number;
};

export class UserStatsAccount {
  static fromJsonWithPubkey(
    json: UserStatsAccountJsonWithPubkey
  ): UserStatsAccountWithPubkey {
    return {
      publicKey: new PublicKey(json.publicKey),
      data: UserStatsAccount.fromJson(json.data),
    };
  }

  static fromJson(json: UserStatsAccountJson): UserStatsAccountData {
    return {
      authority: new PublicKey(json.authority),
      qrCodesCreated: new BN(json.qrCodesCreated),
      totalTransfers: new BN(json.totalTransfers),
      totalValueTransfered: new BN(json.totalValueTransfered),
      lastActiveTimestamp: new BN(json.lastActiveTimestamp),
      bump: json.bump,
    };
  }

  static toJsonWithPubkey(
    userStats: UserStatsAccountWithPubkey
  ): UserStatsAccountJsonWithPubkey {
    return {
      publicKey: userStats.publicKey.toBase58(),
      data: UserStatsAccount.toJson(userStats.data),
    };
  }

  static toJson(json: UserStatsAccountData): UserStatsAccountJson {
    return {
      authority: json.authority.toBase58(),
      qrCodesCreated: json.qrCodesCreated.toString(),
      totalTransfers: json.totalTransfers.toString(),
      totalValueTransfered: json.totalValueTransfered.toString(),
      lastActiveTimestamp: json.lastActiveTimestamp.toString(),
      bump: json.bump,
    };
  }
}
