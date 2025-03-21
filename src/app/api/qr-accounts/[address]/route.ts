import { QrAccount } from '@/model/QrAccount';
import { getDynamicProgram } from '@/utils/getDynamicProgram';
import { isPublicKeyValid } from '@/utils/isPublicKeyValid';
import { PublicKey } from '@solana/web3.js';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const address = (await params).address;

  if (!address) {
    return new Response('Address is required', {
      status: 400,
    });
  }

  if (!isPublicKeyValid(address)) {
    return new Response('Invalid address', {
      status: 400,
    });
  }

  const program = getDynamicProgram();
  const qrAccount = await program.account.qrAccount.fetch(
    new PublicKey(address)
  );
  const qrAccountJson = QrAccount.toJson(qrAccount);

  return new Response(JSON.stringify(qrAccountJson), {
    headers: { 'content-type': 'application/json' },
  });
}
