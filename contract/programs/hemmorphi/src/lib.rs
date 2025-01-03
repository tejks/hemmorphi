use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("9m9Jxk8tMmjphGgCRBCS5wnr9VXFSqmjGkDxVcpcfj2J");

mod errors;

const DISCRIMINATOR: usize = 8;

#[program]
pub mod hemmorphi {
    use errors::CustomError;

    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>, name: String) -> Result<()> {
        msg!("Initialize user account");

        let user = &mut ctx.accounts.user;

        // Validate name length
        require!(name.len() <= User::NAME_MAX_LEN, CustomError::NameTooLong);

        user.name = name; // Store the name
        user.authority = ctx.accounts.authority.key(); // Store the authority
        user.hashes = Vec::new(); // Start with an empty list of QRs
        user.bump = ctx.bumps.user; // Store the bump seed

        Ok(())
    }

    pub fn initialize_user_stats(ctx: Context<InitializeUserStats>) -> Result<()> {
        msg!("Initialize user stats account");

        let user_stats = &mut ctx.accounts.user_stats;

        user_stats.qr_codes_created = 0;
        user_stats.total_transfers = 0;
        user_stats.total_value_transfered = 0;
        user_stats.last_active_timestamp = 0;
        user_stats.authority = ctx.accounts.user.authority;
        user_stats.bump = ctx.bumps.user_stats;

        Ok(())
    }

    pub fn initialize_user_qr(
        ctx: Context<InitializeUserQr>,
        hash: String,
        amount: u64,
        tokens: Vec<Pubkey>,
    ) -> Result<()> {
        msg!("Initialize user QR account");

        let qr_account = &mut ctx.accounts.qr_account;
        let user = &mut ctx.accounts.user;

        // Ensure the QR list in the user account isn't full
        require!(user.hashes.len() < 5, CustomError::QrListFull);

        // Ensure the hash is unique in the user’s QR list
        require!(
            !user
                .hashes
                .iter()
                .any(|existing_hash| existing_hash == &hash),
            CustomError::QrAlreadyExists
        );

        // Ensure the tokens list isn't too large
        require!(
            tokens.len() <= QrAccount::TOKENS_MAX_COUNT,
            CustomError::QrTooManyTokens
        );

        // Ensure there are no repeated tokens
        let mut token_set = tokens.clone();
        token_set.sort();
        token_set.dedup();
        require!(
            token_set.len() == tokens.len(),
            CustomError::QrRepeatedTokens
        );

        qr_account.hash = hash.clone();
        qr_account.amount = amount;
        qr_account.tokens = tokens.clone();
        qr_account.authority = user.authority;
        qr_account.last_transfer_timestamp = 0;
        qr_account.tokens_stats = vec![TokenStats::default(); tokens.len()];
        qr_account.bump = ctx.bumps.qr_account;

        user.hashes.push(hash);

        Ok(())
    }

    pub fn remove_user(_ctx: Context<RemoveUser>) -> Result<()> {
        msg!("Removing user account");

        Ok(())
    }

    pub fn remove_user_stats(_ctx: Context<RemoveUserStats>) -> Result<()> {
        msg!("Removing user stats account");

        Ok(())
    }

    pub fn remove_user_qr(_ctx: Context<RemoveUserQr>, hash: String) -> Result<()> {
        msg!("Removing user QR account");

        let user = &mut _ctx.accounts.user;

        // Remove the hash from the user's list
        user.hashes.retain(|h| h != &hash);

        Ok(())
    }

    pub fn qr_transfer_lamports(ctx: Context<QrTransferLamports>, amount: u64) -> Result<()> {
        let from_account = &ctx.accounts.from;
        let to_account = &ctx.accounts.to;
        let qr_account = &mut ctx.accounts.qr_account;
        let user_stats = &mut ctx.accounts.user_stats;

        // Check if the amount is zero
        require!(amount > 0, CustomError::TransferAmountZero);

        // Check if the QR code has enough lamports
        require!(
            from_account.lamports() >= amount,
            CustomError::WrongTransferAmount
        );

        let sol_pubkey = Pubkey::from_str("So11111111111111111111111111111111111111112").unwrap();
        // Check if the QR code has token
        require!(
            qr_account.check_if_token_exists(sol_pubkey),
            CustomError::TokenNotExistsInQrAccount
        );

        // Check if the amount is correct
        require!(
            qr_account.check_if_correct_amount(amount),
            CustomError::WrongTransferAmount
        );

        // Check if the destination is correct
        require!(
            qr_account.authority == to_account.key(),
            CustomError::WrongTransferDestination
        );

        // Create the transfer instruction
        let transfer_instruction =
            system_instruction::transfer(from_account.key, to_account.key, amount);

        // Invoke the transfer instruction
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_instruction,
            &[
                from_account.to_account_info(),
                to_account.clone(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        qr_account.update_token_stats(sol_pubkey, amount);
        user_stats.update_transfer_stats();

        Ok(())
    }

    pub fn qr_transfer_spl(ctx: Context<QrTransferSpl>, amount: u64) -> Result<()> {
        let qr_account = &mut ctx.accounts.qr_account;
        let user_stats = &mut ctx.accounts.user_stats;
        let source = &ctx.accounts.source;
        let destination = &ctx.accounts.destination;
        let token_program = &ctx.accounts.token_program;
        let authority = &ctx.accounts.from;
        let token = source.mint;

        // Check if the amount is zero
        require!(amount > 0, CustomError::TransferAmountZero);

        // Check if the QR code has token
        require!(
            qr_account.check_if_token_exists(token),
            CustomError::TokenNotExistsInQrAccount
        );

        // Check if the amount is correct
        require!(
            qr_account.check_if_correct_amount(amount),
            CustomError::WrongTransferAmount
        );

        // Check if the destination is correct
        require!(
            qr_account.authority == destination.owner,
            CustomError::WrongTransferDestination
        );

        // Transfer tokens from taker to initializer
        let cpi_accounts = SplTransfer {
            from: source.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: authority.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        qr_account.update_token_stats(token, amount);
        user_stats.update_transfer_stats();

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR + User::INIT_SPACE,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveUser<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump,
        close = authority
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

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
