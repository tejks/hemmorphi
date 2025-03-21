'use client';

import { useHemmorphiProgram } from '@/hooks/useHemmorphiProgram';
import { useTokens } from '@/hooks/useTokens';
import { QrAccountWithPubkey } from '@/model/QrAccount';
import { sendTransactionWithConfirmation } from '@/utils/sendTransactionWithConfirmation';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { IoQrCodeOutline } from 'react-icons/io5';
import Modal from '../common/Modal';
import { QRCode } from '../QRCode/QRCode';
import { showToast } from '../Toastify';

interface Props {
  qr: QrAccountWithPubkey;
  onQRClick: (qr: string) => void;
  callback: () => void;
}

const QRListElement = ({ qr, callback }: Props) => {
  const wallet = useAnchorWallet();
  const program = useHemmorphiProgram();
  const { connection } = useConnection();

  const tokens = useTokens(qr.data.tokens.map((t) => t.toString()));
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const transferUrl = useMemo(() => {
    return `${window.location.origin}/transfer?address=${qr.publicKey.toString()}&mode=custom`;
  }, [qr]);

  const handleRemoveUserQr = async () => {
    if (!wallet) return;

    const removeUserQrInstruction = await program.methods
      .removeUserQr(qr.data.hash)
      .accounts({
        authority: wallet.publicKey,
      })
      .instruction();

    const tx = new Transaction().add(removeUserQrInstruction);

    const signature = await sendTransactionWithConfirmation(
      wallet,
      tx,
      connection
    );

    if (typeof signature === 'string') {
      setShowQR(false);
      showToast('success', 'QR removed successfully');
      callback();
    } else {
      showToast('error', 'Failed to remove QR');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transferUrl);

    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <>
      <div className="flex justify-between bg-orange-500/20 rounded-xl shadow-lg">
        <div className="flex flex-col">
          <div className="px-3 pb-2 pt-3 ">
            {qr.data.tokens.length === 1 ? (
              <div className="flex space-x-3">
                <Image
                  src={tokens[0].logoURI}
                  width={37}
                  height={37}
                  alt={tokens[0].symbol}
                  loading="lazy"
                  className="rounded-full"
                />

                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-700">
                    {tokens[0].symbol}
                  </p>
                  <p className="text-xs text-gray-500">{tokens[0].name}</p>
                </div>
              </div>
            ) : (
              <div className="flex relative -space-x-4">
                {tokens.map((token, index) => (
                  <Image
                    key={token.address}
                    src={`https://wsrv.nl/?w=48&h=48&url=${token.logoURI.trimStart() as string}`}
                    width={37}
                    height={37}
                    alt={token.symbol}
                    style={{ zIndex: tokens.length - index }}
                    loading="lazy"
                    className="rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-700 flex space-x-5 px-3 py-2 items-center">
            <p className="">
              Mode:{' '}
              <span className="bg-orange-300 rounded-md px-1.5 py-0.5 text-orange-700 border-0 border-orange-700 uppercase text-xs">
                {qr.data.tokens.length === 1 ? 'single' : 'multi'}
              </span>
              <span className="bg-orange-300 rounded-md ml-2 px-1.5 py-0.5 text-orange-700 border-0 border-orange-700 uppercase text-xs">
                {qr.data.amount && !qr.data.amount.eqn(0)
                  ? `fixed ${qr.data.amount}`
                  : 'variable'}
              </span>
            </p>
          </div>
        </div>
        <div
          className="flex justify-center items-center px-6 border-l-2 border-gray-500/10 group cursor-pointer"
          onClick={() => setShowQR(true)}
        >
          <IoQrCodeOutline className="text-4xl stroke-orange-700 text-orange-700 group-hover:scale-110 duration-200" />
        </div>
      </div>

      {showQR && (
        <Modal isOpen={showQR} onClose={() => setShowQR(false)}>
          <div className="flex flex-col items-center">
            <QRCode data={transferUrl} width={400} height={400} />

            <div className="text-sm text-gray-700 flex space-x-5 px-3 py-2 items-center">
              <span className="bg-orange-300 rounded-md px-2 py-1 text-orange-700 border-0 border-orange-700 uppercase text-sm">
                {qr.data.tokens.length === 1 ? 'single' : 'multi'}
              </span>
              <span className="bg-orange-300 rounded-md ml-2 px-2 py-1 text-orange-700 border-0 border-orange-700 uppercase text-sm">
                {qr.data.amount && !qr.data.amount.eqn(0)
                  ? `fixed ${qr.data.amount}`
                  : 'variable'}
              </span>
            </div>

            <div className="grid grid-cols-2 w-full px-12 py-5">
              {[...qr.data.tokensStats].map((token, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-700 flex justify-between px-3 py-4 items-center col-span-2 [&:not(:last-child)]:border-b border-gray-500/10"
                >
                  <div className="flex space-x-3">
                    <div>
                      <Image
                        src={tokens[index].logoURI}
                        width={37}
                        height={37}
                        alt={tokens[index].symbol}
                        loading="lazy"
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {tokens[index].symbol}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tokens[index].name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500">
                      Total amount: {token.totalAmount.toString()}{' '}
                      {tokens[0].symbol}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total value: {token.totalValue.toString()} $
                    </p>
                    <p className="text-xs text-gray-500">
                      Transfer count: {token.transferCount.toString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex w-full py-5">
              <button
                className="text-neutral-700 text-lg cursor-pointer border-r-2 flex-1"
                onClick={copyToClipboard}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                className="text-neutral-700 text-lg cursor-pointer border-l-2 flex-1"
                onClick={handleRemoveUserQr}
              >
                Remove
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default QRListElement;
