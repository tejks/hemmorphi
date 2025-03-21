import { Program } from '@coral-xyz/anchor';
import IDL from 'contract/target/idl/hemmorphi.json';
import { Hemmorphi } from 'contract/target/types/hemmorphi';
import { useAnchorProvider } from './useAnchorProvider';

export const useHemmorphiProgram = () => {
  const provider = useAnchorProvider();

  return new Program<Hemmorphi>(IDL as Hemmorphi, provider);
};
