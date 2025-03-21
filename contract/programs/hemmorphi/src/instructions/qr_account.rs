use crate::state::qr_account::*;
use crate::state::user::*;
use anchor_lang::prelude::*;

const DISCRIMINATOR: usize = 8;

#[derive(Accounts)]
#[instruction(
    hash: String
)]
pub struct InitializeUserQr<'info> {
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR + QrAccount::INIT_SPACE,
        seeds = [b"qr", user.key().as_ref(), hash.as_bytes().as_ref()],
        bump
    )]
    pub qr_account: Account<'info, QrAccount>,
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    hash: String
)]
pub struct RemoveUserQr<'info> {
    #[account(
        mut,
        seeds = [b"qr", user.key().as_ref(), hash.as_bytes().as_ref()],
        bump,
        close = authority
    )]
    pub qr_account: Account<'info, QrAccount>,
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
