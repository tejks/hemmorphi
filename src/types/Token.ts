export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
  created_at: string;
  freeze_authority: string;
  mint_authority: string;
  permanent_delegate: string;
  minted_at: string;
}
