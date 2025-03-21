use crate::state::qr_account::*;
use crate::state::user_stats::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct QrTransferSpl<'info> {
    pub from: Signer<'info>,
    #[account(
        mut,
        constraint = source.owner == from.key(),
    )]
    pub source: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub qr_account: Account<'info, QrAccount>,
    #[account(mut)]
    pub user_stats: Account<'info, UserStats>,
    pub token_program: Program<'info, Token>,
}
