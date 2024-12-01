'use client';

import { Token } from '@/types/Token';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CircleLoader } from 'react-spinners';
import Searchbar from './SearchBar';

interface Props {
  onElementClick?: (token: Token) => void;
}

const TokensList = ({ onElementClick }: Props) => {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    async function fetchImages() {
      const response = await fetch('/tokens.json');
      const data: Token[] = await response.json();

      setTokens(data);
    }
    fetchImages();
  }, []);

  if (tokens.length === 0)
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
        {tokens
          .filter((e) => e.logoURI && e.logoURI !== '')
          .map((token) => {
            return (
              <div
                key={token.address}
                onClick={() => onElementClick && onElementClick(token)}
                className="flex cursor-pointer items-center py-4 hover:bg-neutral-200"
              >
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
            );
          })}
      </div>
    </div>
  );
};

export default TokensList;
