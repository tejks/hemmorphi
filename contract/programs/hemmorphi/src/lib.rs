use anchor_lang::prelude::*;

declare_id!("GCVDMEzSCGpmcVkF6mipLB14ircebswewFiXqUYf6NVM");

mod errors;

#[program]
pub mod hemmorphi {
    use errors::CustomError;

    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>, name: String) -> Result<()> {
        let user = &mut ctx.accounts.user;

        // Validate name length
        require!(name.len() <= User::NAME_MAX_LEN, CustomError::NameTooLong);

        user.name = name; // Store the name
        user.authority = ctx.accounts.authority.key(); // Store the authority
        user.qrs = Vec::new(); // Start with an empty list of QRs
        user.bump = ctx.bumps.user; // Store the bump seed

        Ok(())
    }

    pub fn add_user_qr(ctx: Context<AddUserQr>, qr: Qr) -> Result<()> {
        let user = &mut ctx.accounts.user;

        // Ensure the QR list isn't full
        require!(
            user.qrs.len() < User::QRS_MAX_COUNT,
            CustomError::QrListFull
        );

        // Ensure the QR doesn't already exist
        require!(
            !user.check_if_qr_exists(&qr.hash),
            CustomError::QrAlreadyExists
        );

        // Ensure the QR doesn't have too many tokens
        require!(
            qr.tokens.len() <= Qr::TOKENS_MAX_COUNT,
            CustomError::QrTooManyTokens
        );

        // Ensure the QR doesn't have repeated tokens
        require!(
            !qr.check_if_token_repitition(),
            CustomError::QrRepeatedTokens
        );

        // Add the new QR
        user.qrs.push(qr);

        Ok(())
    }

    pub fn remove_user_qr(ctx: Context<RemoveUserQr>, qr_hash: String) -> Result<()> {
        let user = &mut ctx.accounts.user;

        // Find the QR to remove
        let index = user.qrs.iter().position(|qr| qr.hash == qr_hash);
        require!(index.is_some(), CustomError::QrNotFound);

        // Remove the QR
        user.qrs.remove(index.unwrap());

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = authority,
        space = User::space(),
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddUserQr<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveUserQr<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    pub authority: Signer<'info>,
}

#[account]
pub struct User {
    pub name: String,      // User's name
    pub qrs: Vec<Qr>,      // List of QRs
    pub authority: Pubkey, // User's wallet (to ensure the user owns the account)
    pub bump: u8,          // PDA bump seed
}

impl User {
    pub const NAME_MAX_LEN: usize = 32;
    pub const QRS_MAX_COUNT: usize = 5;

    pub fn space() -> usize {
        4 + Self::NAME_MAX_LEN +        // Name
        32 +                            // Authority
        4 + (Self::QRS_MAX_COUNT * 200) // QR vector
    }

    pub fn check_if_qr_exists(&self, qr_hash: &str) -> bool {
        self.qrs.iter().any(|qr| qr.hash == qr_hash)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Qr {
    pub hash: String,        // Unique identifier
    pub amount: u64,         // Some amount (e.g., lamports or tokens)
    pub tokens: Vec<Pubkey>, // Fixed-size array of Pubkeys
}

impl Qr {
    pub const TOKENS_MAX_COUNT: usize = 5;

    pub fn check_if_token_repitition(&self) -> bool {
        let mut tokens = self.tokens.clone();
        tokens.sort();
        tokens.dedup();
        tokens.len() != self.tokens.len()
    }
}
