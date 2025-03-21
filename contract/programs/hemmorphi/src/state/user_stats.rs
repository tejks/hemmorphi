use anchor_lang::prelude::*;
use anchor_lang::{prelude::Pubkey, InitSpace};

#[account]
#[derive(Default, InitSpace)]
pub struct UserStats {
    pub authority: Pubkey,           // Owner of the user stats account
    pub qr_codes_created: u64,       // Total number of QR codes created
    pub total_transfers: u64,        // Total number of transfers
    pub total_value_transfered: u64, // Total value transfered
    pub last_active_timestamp: i64,  // Timestamp of the last activity
    pub bump: u8,                    // PDA bump seed
}

impl UserStats {
    pub fn update_codes_stats(&mut self) {
        self.qr_codes_created += 1;
    }

    pub fn update_transfer_stats(&mut self) {
        self.total_transfers += 1;
    }
}
