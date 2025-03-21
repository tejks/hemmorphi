import { UserStatsAccount } from '@/model/StatsAccount';
import { findProgramUserStatsAddress } from '@/utils/findProgramUserStatsAddress';
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
  const userAccountAddress = findProgramUserStatsAddress(
    program.programId,
    new PublicKey(address)
  );
  const userStatsAccount =
    await program.account.userStats.fetch(userAccountAddress);
  const userStatsAccountJson = UserStatsAccount.toJson(userStatsAccount);

  return new Response(JSON.stringify(userStatsAccountJson), {
    headers: { 'content-type': 'application/json' },
  });
}
