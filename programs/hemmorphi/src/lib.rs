use anchor_lang::prelude::*;

declare_id!("GCVDMEzSCGpmcVkF6mipLB14ircebswewFiXqUYf6NVM");

#[program]
pub mod hemmorphi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
