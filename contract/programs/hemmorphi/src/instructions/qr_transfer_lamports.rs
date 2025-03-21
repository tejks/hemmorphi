use crate::state::qr_account::*;
use crate::state::user_stats::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct QrTransferLamports<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    /// CHECK: This is not dangerous because we just transfer lamports to this account
    #[account(mut)]
    pub to: AccountInfo<'info>,
    #[account(mut)]
    pub qr_account: Account<'info, QrAccount>,
    #[account(mut)]
    pub user_stats: Account<'info, UserStats>,
    pub system_program: Program<'info, System>,
}
