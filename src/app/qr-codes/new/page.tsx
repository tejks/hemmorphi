'use client';

import Modal from '@/components/common/Modal';
import { showToast } from '@/components/Toastify';
import TokensList from '@/components/TokensList/TokensList';
import { useHemmorphiProgram } from '@/hooks/useHemmorphiProgram';
import { TOKENS } from '@/lib/constant';
import { Token } from '@/types/Token';
import { findQrHash } from '@/utils';
import { cn } from '@/utils/cn';
import { createInitializeQrAccountInstruction } from '@/utils/instructions/createInitializeQrAccountInstruction';
import { sendTransactionWithConfirmation } from '@/utils/sendTransactionWithConfirmation';
import * as anchor from '@coral-xyz/anchor';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaBolt, FaInfinity } from 'react-icons/fa6';
import { MdOutlineAddCircleOutline } from 'react-icons/md';

enum AmountMode {
  Fixed = 'fixed',
  Variable = 'variable',
}

enum Mode {
  Standard = 'standard',
  Custom = 'custom',
}

export interface QRData {
  destination: string;
  address: PublicKey;
  mode: Mode;
  // amountMode: AmountMode;
  amount: anchor.BN;
  // tokenMode: TokenMode;
  tokens: PublicKey[];
  hash: string;
}

export default function Page() {
  const wallet = useAnchorWallet();
  const program = useHemmorphiProgram();
  const router = useRouter();

  const [selectedTokens, setSelectedTokens] = useState<Token[]>([TOKENS.SOL]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAmountMode, setSelectedAmountMode] = useState<AmountMode>(
    AmountMode.Variable
  );
  const [fixedAmount, setFixedAmount] = useState<number>(0);

  const handleCreateQR = async () => {
    if (!wallet) {
      showToast('error', 'Connect your wallet');
      return;
    }

    const amount = selectedAmountMode == AmountMode.Fixed ? fixedAmount : 0;
    const tokens = selectedTokens.map((t) => new PublicKey(t.address));
    const hash = findQrHash(wallet.publicKey, amount, tokens);

    // const initializeUserIntruction = await program.methods
    //   .initializeUser('Jacob')
    //   .accounts({
    //     authority: wallet.publicKey,
    //   })
    //   .instruction();

    // const initializeUserStatsInstruction = await program.methods
    //   .initializeUserStats()
    //   .accounts({
    //     authority: wallet.publicKey,
    //   })
    //   .instruction();

    const tx = new Transaction()
      // .add(initializeUserIntruction)
      // .add(initializeUserStatsInstruction)
      .add(
        await createInitializeQrAccountInstruction(program, wallet.publicKey, {
          hash,
          amount: new anchor.BN(amount),
          tokens,
        })
      );

    const signature = await sendTransactionWithConfirmation(
      wallet,
      tx,
      program.provider.connection
    );

    if (typeof signature === 'string') {
      showToast('success', 'Transaction confirmed');
    } else {
      showToast('error', (signature as Error).message);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.replace('/qr-codes');
  };

  const handleAddToSelectedTokens = (token: Token) => {
    const isTokenAlreadySelected = selectedTokens.some(
      (t) => t.address === token.address
    );

    if (isTokenAlreadySelected) return;

    setSelectedTokens([...selectedTokens, token]);
  };

  const handleRemoveFromSelectedTokens = (token: Token) => {
    setSelectedTokens(
      selectedTokens.filter((t) => t.address !== token.address)
    );
  };

  return (
    <main className="flex items-center mx-auto justify-center container px-5 sm:px-0 h-[90%]">
      <div className="w-[500px] bg-white rounded-xl py-5 text-center space-y-10">
        {wallet ? (
          <>
            <h1 className="text-3xl py-7">Create new QR code</h1>

            <div className="flex space-x-5 px-5 justify-center pb-6">
              {selectedTokens.map((token) => (
                <div
                  key={token.address}
                  className="w-[75px] h-[75px] rounded-xl shadow-lg flex items-center justify-center cursor-pointer"
                  onClick={() => handleRemoveFromSelectedTokens(token)}
                >
                  <Image
                    src={token.logoURI}
                    alt={token.symbol}
                    width={50}
                    height={50}
                    unoptimized
                    loading="lazy"
                    className="rounded-full"
                  />
                </div>
              ))}

              {selectedTokens.length < 5 && (
                <div className="w-[75px] h-[75px] rounded-xl shadow-lg flex items-center justify-center cursor-pointer">
                  <MdOutlineAddCircleOutline
                    className="text-4xl"
                    onClick={() => setShowModal(true)}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="text-neutral-600 leading-none shadow-lg rounded-xl inline-flex text-lg">
                <button
                  className={cn(
                    'inline-flex items-center transition-colors duration-300 ease-in focus:outline-none hover:text-orange-500 rounded-l-xl px-4 py-2',
                    selectedAmountMode == AmountMode.Variable
                      ? 'text-orange-500'
                      : ''
                  )}
                  onClick={() => setSelectedAmountMode(AmountMode.Variable)}
                >
                  <FaInfinity className="mr-2" />
                  <span>Variable</span>
                </button>
                <button
                  className={cn(
                    'inline-flex items-center transition-colors duration-300 ease-in focus:outline-none hover:text-orange-500 rounded-l-xl px-4 py-2',
                    selectedAmountMode == AmountMode.Fixed
                      ? 'text-orange-500'
                      : ''
                  )}
                  onClick={() => setSelectedAmountMode(AmountMode.Fixed)}
                >
                  <FaBolt className="mr-2" />
                  <span>Fixed</span>
                </button>
              </div>
            </div>

            {selectedAmountMode == AmountMode.Fixed && (
              <div className="px-24">
                <input
                  type="number"
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-orange-500"
                  placeholder="Enter amount"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(Number(e.target.value))}
                />
              </div>
            )}

            <div className="py-5">
              <button
                onClick={handleCreateQR}
                className="border-orange-500 border-2 text-xl rounded-lg shadow-lg px-8 py-2"
              >
                Create
              </button>
            </div>
          </>
        ) : (
          <p className="py-40 text-2xl">Connect your wallet</p>
        )}
      </div>

      {showModal && (
        <Modal
          className="h-4/5 w-[30rem]"
          onClose={() => setShowModal(false)}
          isOpen={showModal}
        >
          <TokensList
            onElementClick={(token) => {
              handleAddToSelectedTokens(token);
              setShowModal(false);
            }}
          />
        </Modal>
      )}
    </main>
  );
}
