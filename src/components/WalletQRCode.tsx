'use client';

import { useMemo, useState } from 'react';
import { QRCode } from './QRCode/QRCode';

interface Props {
  walletAddress: string;
}

const WalletQRCode = ({ walletAddress }: Props) => {
  const transferUrl = useMemo(() => {
    return `${window.location.origin}/transfer?address=${walletAddress}&mode=standard`;
  }, [walletAddress]);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transferUrl);

    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <QRCode data={transferUrl} height={350} width={350} />
      <button
        onClick={copyToClipboard}
        className="border-orange-500 border-2 text-xl rounded-lg shadow-lg px-8 py-2"
      >
        {copied ? 'Coped' : 'Copy'}
      </button>
    </div>
  );
};

export default WalletQRCode;
