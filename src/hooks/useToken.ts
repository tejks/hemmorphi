import { useTokenList } from '@/components/TokenProvider/TokenProvider';
import { Token } from '@/types/Token';

export const useToken = (
  identifier: string,
  key: 'symbol' | 'address' = 'address'
): Token => {
  const { tokenList, error } = useTokenList();

  if (error) throw new Error(error);

  const token = tokenList.find((token) => token[key] === identifier);
  if (!token) throw new Error(`Token with ${key} "${identifier}" not found.`);

  return token;
};
