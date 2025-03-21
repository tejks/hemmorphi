use anchor_lang::error_code;

#[error_code]
pub enum CustomError {
    #[msg("Name is too long")]
    NameTooLong,
    #[msg("QR list is full")]
    QrListFull,
    #[msg("QR not found")]
    QrNotFound,
    #[msg("QR already exists")]
    QrAlreadyExists,
    #[msg("QR has repeated tokens")]
    QrRepeatedTokens,
    #[msg("QR has too many tokens")]
    QrTooManyTokens,
    #[msg("Token not found")]
    TokenNotFound,
    #[msg("Token not exists in QR account")]
    TokenNotExistsInQrAccount,
    #[msg("Wrong transfer amount")]
    WrongTransferAmount,
    #[msg("Wrong transfer destination")]
    WrongTransferDestination,
    #[msg("Transfer amount cannot be zero")]
    TransferAmountZero,
}
