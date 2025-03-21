'use client';

import { useAnchorProvider } from '@/hooks/useAnchorProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

import { useHemmorphiProgram } from '@/hooks/useHemmorphiProgram';
import { useToken } from '@/hooks/useToken';
import { useWalletTokenAccounts } from '@/hooks/useWalletTokenAccounts';
import { TOKENS } from '@/lib/constant';
import { QrAccountData } from '@/model/QrAccount';
import { Token } from '@/types/Token';
import { TokenPrice } from '@/types/TokenPrice';
import { createLamportTransferInstruction } from '@/utils/instructions/createLamportTransferInstruction';
import { createSplTransferInstruction } from '@/utils/instructions/createSplTransferInstruction';
import { sendTransactionWithConfirmation } from '@/utils/sendTransactionWithConfirmation';
import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import Input from './common/Input';
import Modal from './common/Modal';
import { showToast } from './Toastify';
import TokenSelector from './TokenSelector';
import TokensList from './TokensList/TokensList';

type FormValues = {
  amount: number;
};

interface Props {
  destination: string;
  qrAccount: QrAccountData | null;
}

export const TransferFrom = ({ destination, qrAccount }: Props) => {
  const provider = useAnchorProvider();
  const { connection } = useConnection();
  const program = useHemmorphiProgram();
  const wallet = useAnchorWallet();

  const { tokenAccountsAmountMap } = useWalletTokenAccounts();
  const defaultToken = useToken(
    qrAccount ? qrAccount.tokens[0].toString() : TOKENS.SOL.address
  );

  const [selectedToken, setSelectedToken] = useState<Token>(
    defaultToken || TOKENS.SOL
  );
  const [tokensPrices, setTokensPrices] = useState<Map<string, TokenPrice>>(
    new Map()
  );
  const [selectedTokenAmount, setSelectedTokenAmount] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

  const validationSchema = z.object({
    amount: z.string().min(1, 'Amount parameter is required'),
  });

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<FormValues> = async ({ amount }) => {
    if (!provider || !wallet || !selectedToken.address) return;

    const amountBN = new BN(amount * 10 ** selectedToken.decimals);

    const tx = new Transaction();

    if (qrAccount) {
      if (selectedToken.address === TOKENS.SOL.address)
        tx.add(
          await createLamportTransferInstruction(
            program,
            wallet.publicKey,
            qrAccount.authority,
            amountBN,
            new PublicKey(destination)
          )
        );
      else
        tx.add(
          await createSplTransferInstruction(
            program,
            wallet.publicKey,
            new PublicKey(destination),
            new PublicKey(selectedToken.address),
            amountBN,
            new PublicKey(destination)
          )
        );
    } else {
      if (selectedToken.address === TOKENS.SOL.address)
        tx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(destination),
            lamports: amountBN.toNumber(),
          })
        );
      else
        tx.add(
          createTransferInstruction(
            await getAssociatedTokenAddress(
              new PublicKey(selectedToken.address),
              wallet.publicKey
            ),
            await getAssociatedTokenAddress(
              new PublicKey(selectedToken.address),
              new PublicKey(destination)
            ),
            wallet.publicKey,
            amountBN.toNumber()
          )
        );
    }

    const signature = await sendTransactionWithConfirmation(
      wallet,
      tx,
      connection
    );

    if (typeof signature === 'string') {
      showToast('success', 'Transaction confirmed');
    } else {
      showToast('error', (signature as Error).message);
    }
  };

  useEffect(() => {
    if (tokenAccountsAmountMap.size > 0) {
      const amount = tokenAccountsAmountMap.get(selectedToken.address);

      setSelectedTokenAmount(
        amount ? Number(amount) / 10 ** selectedToken.decimals : 0
      );
    }
  }, [selectedToken, tokenAccountsAmountMap]);

  useEffect(() => {
    if (defaultToken) {
      setSelectedToken(defaultToken);
    }
  }, [defaultToken]);

  useEffect(() => {
    const fetchTokensPrices = async () => {
      const tokens = [...tokenAccountsAmountMap.keys()];
      if (tokens.length === 0) return;

      const tokensPrices = await fetch(
        `/api/tokens/price?ids=${tokens.join(',')}`
      );

      if (!tokensPrices.ok) {
        return;
      }

      const data = await tokensPrices.json();
      const map = new Map<string, TokenPrice>(Object.entries(data));
      setTokensPrices(map);
    };

    fetchTokensPrices();
  }, [tokenAccountsAmountMap]);

  return (
    <>
      <form className="space-y-10" action="#" onSubmit={handleSubmit(onSubmit)}>
        <TokenSelector
          showTokenModal={(show) => setShowModal(show)}
          token={selectedToken}
          disabled={qrAccount && qrAccount.tokens.length < 2 ? true : false}
        />

        <div className="rounded-xl flex flex-col  items-end shadow-xl bg-orange-500/20">
          <div className="flex justify-between text-orange-700 p-2 w-full">
            <div className="px-2 text-neutral-500">
              Balance: {selectedTokenAmount || '0'}
            </div>
            <div className="flex space-x-3">
              <button
                disabled={
                  qrAccount && qrAccount.amount.gt(new BN(0)) ? true : false
                }
                type="button"
                className="text-xs bg-white rounded-md px-1.5 py-0.5"
                onClick={() => setValue('amount', selectedTokenAmount / 2)}
              >
                HALF
              </button>
              <button
                disabled={
                  qrAccount && qrAccount.amount.gt(new BN(0)) ? true : false
                }
                type="button"
                className="text-xs bg-white rounded-md px-1.5 py-0.5"
                onClick={() => setValue('amount', selectedTokenAmount)}
              >
                MAX
              </button>
            </div>
          </div>

          <Input
            labelValue={undefined}
            type="decimal"
            id="amount"
            disabled={
              qrAccount && qrAccount.amount.gt(new BN(0)) ? true : false
            }
            defaultValue={
              qrAccount && qrAccount.amount.gt(new BN(0))
                ? Number(qrAccount.amount)
                : undefined
            }
            className="bg-transparent focus:outline-none text-right text-xl p-3 text-neutral-500"
            autoComplete="off"
            placeholder="0.00"
            register={register('amount')}
          />
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="rounded-xl py-5 bg-orange-500/60 w-full text-orange-700 font-bold hover:outline-orange-600 hover:outline-2"
          >
            Transfer
          </button>
        </div>
      </form>

      <Modal
        className="h-4/5 w-[30rem]"
        onClose={() => setShowModal(false)}
        isOpen={showModal}
      >
        <TokensList
          onElementClick={(token) => {
            setSelectedToken(token);
            setShowModal(false);
          }}
          walletBalances={tokenAccountsAmountMap}
          tokensPrices={tokensPrices}
          whitelist={
            qrAccount ? qrAccount.tokens.map((e) => e.toString()) : undefined
          }
        />
      </Modal>
    </>
  );
};
