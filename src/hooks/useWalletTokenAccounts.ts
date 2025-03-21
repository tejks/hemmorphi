import { TOKENS } from '@/lib/constant';
import { getWalletBalance } from '@/utils/getWalletBalance';
import { getWalletTokenAccounts } from '@/utils/getWalletTokenAccounts';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';

type Account = {
  mint: PublicKey;
  amount: bigint;
};

export const useWalletTokenAccounts = () => {
  const { publicKey } = useWallet();
  const connection = useMemo(() => new Connection(''), []);
  const [tokenAccounts, setTokenAccounts] = useState<Account[]>([]);
  const [tokenAccountsAmountMap, setTokenAccountsAmountMap] = useState<
    Map<string, bigint>
  >(new Map());

  useEffect(() => {
    if (!publicKey) {
      setTokenAccounts([]);
      return;
    }

    const fetchTokenAccounts = async () => {
      const accounts = await getWalletTokenAccounts(publicKey, connection);
      const walletBalance = await getWalletBalance(publicKey, connection);
      setTokenAccounts(accounts);
      const map = new Map(
        accounts.map(({ mint, amount }) => [mint.toString(), amount])
      );
      map.set(TOKENS.SOL.address, BigInt(walletBalance));
      setTokenAccountsAmountMap(map);
    };

    fetchTokenAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  return { tokenAccounts, tokenAccountsAmountMap };
};
