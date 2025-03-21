import { UserAccount } from '@/model/UserAccount';
import { getDynamicProgram } from '@/utils/getDynamicProgram';

export async function GET() {
  const program = getDynamicProgram();
  const usersAccounts = await program.account.user.all();
  const usersAccountsJson = usersAccounts.map((userAccount) =>
    UserAccount.toJsonWithPubkey({
      publicKey: userAccount.publicKey,
      data: userAccount.account,
    })
  );

  return new Response(JSON.stringify(usersAccountsJson), {
    headers: { 'content-type': 'application/json' },
  });
}
