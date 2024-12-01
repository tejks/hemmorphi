'use client';

import { QRData } from '@/app/page';
import { useTokens } from '@/hooks/useTokens';
import sha256 from 'crypto-js/sha256';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { IoQrCodeOutline } from 'react-icons/io5';
import Modal from '../common/Modal';
import { QRCode } from '../QRCode/QRCode';

interface Props {
  qr: QRData;
  onQRClick: (qr: string) => void;
}

const QRListElement = ({ qr }: Props) => {
  const tokens = useTokens(qr.tokens);
  const [showQR, setShowQR] = useState(false);
  const transferHash = useMemo(() => {
    return sha256(JSON.stringify(qr));
  }, [qr]);
  const transferUrl = useMemo(() => {
    return `${window.location.origin}/transfer?dest=${qr.destination}&hash=${transferHash}`;
  }, [transferHash]);

  return (
    <>
      <div className="flex justify-between bg-orange-500/20 rounded-xl">
        <div className="flex flex-col">
          <div className="px-3 pb-2 pt-3 ">
            {qr.tokens.length === 1 ? (
              <div className="flex space-x-2">
                <Image
                  src={tokens[0].logoURI}
                  width={37}
                  height={37}
                  alt={tokens[0].symbol}
                  loading="lazy"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {tokens[0].symbol}
                  </p>
                  <p className="text-xs text-gray-500">{tokens[0].name}</p>
                </div>
              </div>
            ) : (
              <div className="flex relative -space-x-4 hover:-space-x-1 transition-all duration-1000">
                {tokens.map((token, index) => (
                  <Image
                    key={token.address}
                    src={`https://wsrv.nl/?w=48&h=48&url=${token.logoURI.trimStart() as string}`}
                    width={37}
                    height={37}
                    alt={token.symbol}
                    style={{ zIndex: tokens.length - index }}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-700 flex space-x-5 px-3 py-2 items-center">
            <p className="">
              Mode:{' '}
              <span className="bg-orange-300 rounded-md px-1.5 py-0.5 text-orange-700 border-0 border-orange-700 uppercase text-xs">
                {qr.tokenMode}
              </span>
              <span className="bg-orange-300 rounded-md ml-2 px-1.5 py-0.5 text-orange-700 border-0 border-orange-700 uppercase text-xs">
                {qr.amount && qr.amountMode == 'fixed'
                  ? `fixed ${qr.amount}`
                  : qr.amountMode}
              </span>
            </p>
          </div>
        </div>
        <div
          className="flex justify-center items-center px-6 border-l-2 border-gray-500/10 group  cursor-pointer"
          onClick={() => setShowQR(true)}
        >
          <IoQrCodeOutline className="text-4xl stroke-orange-700 text-orange-700 group-hover:scale-110 duration-200" />
        </div>
      </div>

      {showQR && (
        <Modal isOpen={showQR} onClose={() => setShowQR(false)}>
          <div className="flex flex-col items-center">
            <QRCode data={transferUrl} width={400} height={400} />
            <button
              onClick={() => {
                navigator.clipboard.writeText(transferUrl);
              }}
            >
              Copy
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default QRListElement;
