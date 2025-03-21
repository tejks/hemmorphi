import { QrAccount } from '@/model/QrAccount';
import { getDynamicProgram } from '@/utils/getDynamicProgram';

export async function GET() {
  const program = getDynamicProgram();
  const qrAccounts = await program.account.qrAccount.all();
  const qrAccountsJson = qrAccounts.map((qrAccount) =>
    QrAccount.toJsonWithPubkey({
      publicKey: qrAccount.publicKey,
      data: qrAccount.account,
    })
  );

  return new Response(JSON.stringify(qrAccountsJson), {
    headers: { 'content-type': 'application/json' },
  });
}
