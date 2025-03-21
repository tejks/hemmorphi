import { UserAccount } from '@/model/UserAccount';
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
  const userAccount = await program.account.user.fetch(new PublicKey(address));
  const userAccountJson = UserAccount.toJson(userAccount);

  return new Response(JSON.stringify(userAccountJson), {
    headers: { 'content-type': 'application/json' },
  });
}
