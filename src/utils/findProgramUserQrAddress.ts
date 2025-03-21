import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

const QR_SEED = 'qr';

export const findProgramUserQrAddress = (
  programId: PublicKey,
  address: PublicKey,
  hash: string
) => {
  const [qrPda] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(QR_SEED),
      address.toBuffer(),
      anchor.utils.bytes.utf8.encode(hash),
    ],
    programId
  );

  return qrPda;
};
