import Image from 'next/image';

import { Token } from '@/types/Token';
import { cn } from '@/utils/cn';
import { FaAngleDown } from 'react-icons/fa6';

interface Props {
  token: Token;
  showTokenModal: (show: boolean) => void;
  disabled?: boolean;
}

const TokenSelector = ({ token, showTokenModal, disabled }: Props) => {
  return (
    <div
      className={cn(
        'rounded-xl h-20 flex justify-between px-7  shadow-xl bg-orange-500/20',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      )}
      onClick={() => (!disabled ? showTokenModal(true) : null)}
    >
      <div className="flex space-x-5 items-center">
        <Image
          src={`https://wsrv.nl/?w=48&h=48&url=${token.logoURI.trimStart() as string}`}
          alt={token.symbol}
          width={50}
          height={50}
          className="rounded-full object-cover"
          loading="lazy"
        />

        <div className="flex flex-col text-left">
          <div className="text-neutral-700 font-semibold">{token.symbol}</div>
          <div className="text-neutral-500">{token.name}</div>
        </div>
      </div>
      <div className="flex items-center">
        {!disabled ? <FaAngleDown className="h-6 w-6" /> : null}
      </div>
    </div>
  );
};

export default TokenSelector;
