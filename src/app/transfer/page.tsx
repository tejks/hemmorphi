'use client';

import { TransferFrom } from '@/components/TransferFrom';
import WalletTransferAnimation from '@/components/WalletTransferAnimation';
import { useQrAccount } from '@/hooks/hemmorphi/useQrAccount';
import { PublicKey } from '@solana/web3.js';
import { redirect } from 'next/navigation';
import { use } from 'react';
import { z } from 'zod';

const PublicKeySchema = z.string().refine(
  (value) => {
    try {
      new PublicKey(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: 'Invalid Solana public key',
  }
);

const querySchema = z.object({
  address: PublicKeySchema,
  mode: z.enum(['standard', 'custom']),
});

type Query = z.infer<typeof querySchema>;
type SearchParams = Promise<Query>;

interface Props {
  searchParams: SearchParams;
}

export default function Page({ searchParams }: Props) {
  const { success, data: searchParamsData } = querySchema.safeParse(
    use(searchParams)
  );

  if (!success || !searchParamsData) {
    redirect('/404');
  }

  const { address, mode } = searchParamsData;
  const { data } = useQrAccount(address, mode);

  return (
    <main className="flex items-center mx-auto justify-center container px-5 sm:px-0 h-[90%]">
      <div className="w-[500px] bg-white rounded-xl space-y-5 py-4 px-3">
        <WalletTransferAnimation
          dest={data ? data.authority.toString() : address}
        />
        <TransferFrom destination={address} qrAccount={data} />
      </div>
    </main>
  );
}
