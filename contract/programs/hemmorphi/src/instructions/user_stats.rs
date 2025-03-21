use crate::state::user::*;
use crate::state::user_stats::*;
use anchor_lang::prelude::*;

const DISCRIMINATOR: usize = 8;

#[derive(Accounts)]
pub struct InitializeUserStats<'info> {
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR + UserStats::INIT_SPACE,
        seeds = [b"user_stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
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
pub struct RemoveUserStats<'info> {
    #[account(
        mut,
        seeds = [b"user_stats", user.key().as_ref()],
        bump,
        close = authority
    )]
    pub user_stats: Account<'info, UserStats>,
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
