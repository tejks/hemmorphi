import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction } from '@solana/web3.js';

export async function sendTransactionWithConfirmation(
  wallet: AnchorWallet,
  transaction: Transaction,
  connection: Connection
): Promise<string | Error> {
  try {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error('Transaction failed');
    }

    return signature;
  } catch (error) {
    return new Error((error as Error).message);
  }
}
