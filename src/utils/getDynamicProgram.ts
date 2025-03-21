import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import IDL from 'contract/target/idl/hemmorphi.json';
import { Hemmorphi } from 'contract/target/types/hemmorphi';

export function getDynamicProgram() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const provider = new AnchorProvider(
    connection,
    null,
    AnchorProvider.defaultOptions()
  );
  return new Program<Hemmorphi>(IDL as Hemmorphi, provider);
}
