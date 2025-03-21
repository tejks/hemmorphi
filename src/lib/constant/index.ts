import { Token } from '@/types/Token';

const SOL: Token = {
  address: 'So11111111111111111111111111111111111111112',
  name: 'Wrapped SOL',
  symbol: 'SOL',
  decimals: 9,
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  tags: ['verified', 'strict', 'community'],
  daily_volume: 4190601.41162184,
  created_at: '2024-04-26T10:56:58.893768Z',
  freeze_authority: '',
  mint_authority: '',
  permanent_delegate: '',
  minted_at: '',
};

export const TOKENS = {
  SOL,
};
