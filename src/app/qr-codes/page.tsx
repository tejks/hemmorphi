'use client';

import QRList from '@/components/QRList/QRList';
import WalletQRCode from '@/components/WalletQRCode';
import { useUserQrAccounts } from '@/hooks/hemmorphi/useUserQrAccounts';
import { useAnchorWallet } from '@solana/wallet-adapter-react';

export default function Page() {
  const wallet = useAnchorWallet();
  const { data, refresh } = useUserQrAccounts();

  return (
    <main className="flex items-center mx-auto justify-center container sm:px-0 h-[90%]">
      <div className="w-[500px] bg-white rounded-xl space-y-5 py-4">
        {wallet ? (
          <>
            <WalletQRCode walletAddress={wallet.publicKey.toString()} />
            <QRList data={data} callback={refresh} />
          </>
        ) : (
          <p className="py-40 text-2xl w-full text-center">
            Connect your wallet
          </p>
        )}
      </div>
    </main>
  );
}
