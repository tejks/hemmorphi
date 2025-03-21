use anchor_lang::prelude::*;

use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Transfer as SplTransfer};
use std::str::FromStr;

use instructions::*;
use state::*;

pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("9m9Jxk8tMmjphGgCRBCS5wnr9VXFSqmjGkDxVcpcfj2J");

#[program]
pub mod hemmorphi {
    use super::*;

    use errors::CustomError;

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
