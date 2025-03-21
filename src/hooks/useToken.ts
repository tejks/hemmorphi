import { useTokenList } from '@/components/TokenProvider/TokenProvider';
import { Token } from '@/types/Token';

export const useToken = (
  identifier: string,
  key: 'symbol' | 'address' = 'address'
): Token | null => {
  const { tokenList, error } = useTokenList();

  if (error) throw new Error(error);
  const token = tokenList.find((token) => token[key] === identifier);
  if (!token) return null;

  return token;
};
