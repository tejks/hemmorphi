import { UserStatsAccount } from '@/model/StatsAccount';
import { getDynamicProgram } from '@/utils/getDynamicProgram';

export async function GET() {
  const program = getDynamicProgram();
  const usersStatsAccounts = await program.account.userStats.all();
  const usersStatsAccountsJson = usersStatsAccounts.map((userStatsAccount) =>
    UserStatsAccount.toJsonWithPubkey({
      publicKey: userStatsAccount.publicKey,
      data: userStatsAccount.account,
    })
  );

  return new Response(JSON.stringify(usersStatsAccountsJson), {
    headers: { 'content-type': 'application/json' },
  });
}
