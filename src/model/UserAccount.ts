import { PublicKey } from '@solana/web3.js';

export type UserAccountWithPubkey = {
  publicKey: PublicKey;
  data: UserAccountData;
};

export type UserAccountData = {
  name: string;
  hashes: string[];
  authority: PublicKey;
  bump: number;
};

export type UserAccountJsonWithPubkey = {
  publicKey: PublicKey;
  data: UserAccountJson;
};

export type UserAccountJson = {
  name: string;
  hashes: string[];
  authority: string;
  bump: number;
};

export class UserAccount {
  static fromJsonWithPubkey(
    json: UserAccountJsonWithPubkey
  ): UserAccountWithPubkey {
    return {
      publicKey: json.publicKey,
      data: UserAccount.fromJson(json.data),
    };
  }

  static fromJson(json: UserAccountJson): UserAccountData {
    return {
      name: json.name,
      hashes: json.hashes,
      authority: new PublicKey(json.authority),
      bump: json.bump,
    };
  }

  static toJsonWithPubkey(
    userAccount: UserAccountWithPubkey
  ): UserAccountJsonWithPubkey {
    return {
      publicKey: userAccount.publicKey,
      data: UserAccount.toJson(userAccount.data),
    };
  }

  static toJson(json: UserAccountData): UserAccountJson {
    return {
      name: json.name,
      hashes: json.hashes,
      authority: json.authority.toBase58(),
      bump: json.bump,
    };
  }
}
