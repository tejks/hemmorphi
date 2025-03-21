use anchor_lang::prelude::*;
use anchor_lang::{prelude::Pubkey, InitSpace};

#[account]
#[derive(InitSpace)]
pub struct QrAccount {
    pub authority: Pubkey,            // Owner of the QR code
    pub amount: u64,                  // Value associated with the QR code
    pub last_transfer_timestamp: i64, // Timestamp of the last scan
    pub bump: u8,                     // PDA bump seed
    #[max_len(5, 32)]
    pub tokens: Vec<Pubkey>, // List of tokens
    #[max_len(5)]
    pub tokens_stats: Vec<TokenStats>, // Stats for each token
    #[max_len(32)]
    pub hash: String, // Unique identifier
}

impl QrAccount {
    pub const TOKENS_MAX_COUNT: usize = 5;

    pub fn check_if_token_exists(&self, token: Pubkey) -> bool {
        self.tokens.iter().any(|t| *t == token)
    }

    pub fn check_if_correct_amount(&self, amount: u64) -> bool {
        if self.amount == 0 {
            return true;
        } else {
            return self.amount == amount;
        }
    }

    pub fn update_token_stats(&mut self, token: Pubkey, amount: u64) {
        let index = self.tokens.iter().position(|t| *t == token).unwrap();
        self.tokens_stats[index].transfer_count += 1;
        self.tokens_stats[index].total_amount += amount;
        self.tokens_stats[index].total_value += amount;
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, InitSpace)]
pub struct TokenStats {
    pub transfer_count: u64, // Number of transfers
    pub total_amount: u64,   // Total amount transferred
    pub total_value: u64,    // Total value transferred
}
