use anchor_lang::prelude::*;
use anchor_lang::{prelude::Pubkey, InitSpace};

#[account]
#[derive(InitSpace)]
pub struct User {
    #[max_len(20)]
    pub name: String, // User's name
    #[max_len(5, 32)]
    pub hashes: Vec<String>, // List of QRs
    pub authority: Pubkey, // User's wallet (to ensure the user owns the account)
    pub bump: u8,          // PDA bump seed
}

impl User {
    pub const NAME_MAX_LEN: usize = 20;
}
