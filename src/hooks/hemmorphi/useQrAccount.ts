import { QrAccount, QrAccountData } from '@/model/QrAccount';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { useHemmorphiProgram } from '../useHemmorphiProgram';

export const useQrAccount = (address: string, mode: 'custom' | 'standard') => {
  const program = useHemmorphiProgram();
  const wallet = useAnchorWallet();
  const [qrAccounts, setQrAccounts] = useState<QrAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQrAccounts = async () => {
    if (mode === 'standard') return;
    if (!program || !wallet) return;

    try {
      const qrAccount = await fetch(`/api/qr-accounts/${address}`)
        .then((res) => res.json())
        .then((json) => QrAccount.fromJson(json).data);

      setQrAccounts(qrAccount);
    } catch (error) {
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    fetchQrAccounts();
  };

  useEffect(() => {
    fetchQrAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data: qrAccounts, loading, error, refresh };
};
