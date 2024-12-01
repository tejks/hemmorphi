import { useTokenList } from '@/components/TokenProvider/TokenProvider';
import { Token } from '../types/Token';

export const useTokens = (
  identifiers: string[],
  key: 'symbol' | 'address' = 'address'
): Token[] => {
  const { tokenList } = useTokenList();

  const tokens = identifiers.map((identifier) => {
    const token = tokenList.find((token) => token[key] === identifier);
    if (!token) {
      throw new Error(`Token with ${key} "${identifier}" not found.`);
    }
    return token;
  });

  return tokens;
};
