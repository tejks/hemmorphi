import { QrAccount } from '@/model/QrAccount';
import { getDynamicProgram } from '@/utils/getDynamicProgram';
import { getQrAccountsByAuthority } from '@/utils/getQrAccountsByAuthority';
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
  const userQrAccounts = await getQrAccountsByAuthority(
    program.provider.connection,
    program,
    new PublicKey(address)
  );
  const jsonUserQrAccounts = userQrAccounts.map(QrAccount.toJsonWithPubkey);

  return new Response(JSON.stringify(jsonUserQrAccounts), {
    headers: { 'content-type': 'application/json' },
  });
}
