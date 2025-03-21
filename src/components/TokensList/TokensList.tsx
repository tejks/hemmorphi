'use client';

import { Token } from '@/types/Token';
import { TokenPrice } from '@/types/TokenPrice';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CircleLoader } from 'react-spinners';
import { useTokenList } from '../TokenProvider/TokenProvider';
import Searchbar from './SearchBar';

type TokenWithBalance = Token & { balance: number };

interface Props {
  onElementClick?: (token: Token) => void;
  walletBalances?: Map<string, bigint>;
  tokensPrices?: Map<string, TokenPrice>;
  whitelist?: string[];
}

const TokensList = ({
  onElementClick,
  walletBalances,
  whitelist,
  tokensPrices,
}: Props) => {
  const { tokenList } = useTokenList();
  const [tokenListWithBalances, setTokenListWithBalances] = useState<
    TokenWithBalance[]
  >([]);

  useEffect(() => {
    let tokensWhitelist = tokenList;
    if (whitelist && whitelist.length !== 0) {
      tokensWhitelist = tokenList.filter((token) =>
        whitelist.includes(token.address)
      );
    }

    const newTokenListWithBalances = tokensWhitelist.map((token) => {
      return {
        ...token,
        balance: walletBalances
          ? Number(walletBalances.get(token.address) || 0) /
            10 ** token.decimals
          : 0,
      };
    });

    setTokenListWithBalances(newTokenListWithBalances);
  }, [walletBalances, tokenList, whitelist]);

  const showBalanceWithDecimals = (balance: number, decimals: number) => {
    return balance.toLocaleString(undefined, {
      maximumFractionDigits: decimals,
    });
  };

  if (tokenListWithBalances.length === 0)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <CircleLoader color="#000" />
      </div>
    );

  return (
    <div className="flex h-full flex-col items-start">
      <div className="px-6 py-2 w-full">
        <Searchbar onChange={() => {}} />
      </div>

      <div className="flex w-full flex-col overflow-y-scroll">
        {tokenListWithBalances
          .filter((e) => e.logoURI && e.logoURI !== '')
          .sort((a, b) => b.balance - a.balance)
          .map((token) => {
            return (
              <div
                key={token.address}
                onClick={() => onElementClick && onElementClick(token)}
                className="flex cursor-pointer justify-between items-center py-4 hover:bg-neutral-200"
              >
                <div className="flex">
                  <Image
                    alt={token.symbol}
                    className="mx-6 h-11 w-11 rounded-full object-cover"
                    src={`https://wsrv.nl/?w=48&h=48&url=${token.logoURI.trimStart() as string}`}
                    width={10}
                    height={10}
                    unoptimized
                    loading="lazy"
                  />

                  <div className="flex flex-col">
                    <div>{token.symbol.toLocaleUpperCase()}</div>
                    <div className="text-sm text-neutral-400">{token.name}</div>
                  </div>
                </div>
                <div className="flex-1 text-right pr-6 text-neutral-500 font-semibold text-xs space-y-1">
                  <p>
                    {token.balance > 0
                      ? showBalanceWithDecimals(token.balance, token.decimals) +
                        ' ' +
                        token.symbol
                      : ''}
                  </p>
                  <p>
                    {tokensPrices && tokensPrices.has(token.address)
                      ? '$' +
                        (
                          (tokensPrices.get(token.address) as TokenPrice)
                            .price * token.balance
                        ).toFixed(2)
                      : ''}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default TokensList;
