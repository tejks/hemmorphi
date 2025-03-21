import { QrAccount, QrAccountWithPubkey } from '@/model/QrAccount';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { useHemmorphiProgram } from '../useHemmorphiProgram';

export const useUserQrAccounts = () => {
  const program = useHemmorphiProgram();
  const wallet = useAnchorWallet();
  const [qrAccounts, setQrAccounts] = useState<QrAccountWithPubkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQrAccounts = async () => {
    if (!program || !wallet) return;

    try {
      const qrAccounts = await fetch(
        `/api/user/${wallet.publicKey.toString()}/qr-accounts`
      )
        .then((res) => res.json())
        .then((json) => json.map(QrAccount.fromJsonWithPubkey));

      setQrAccounts(qrAccounts);
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
  }, [wallet]);

  return { data: qrAccounts, loading, error, refresh };
};
