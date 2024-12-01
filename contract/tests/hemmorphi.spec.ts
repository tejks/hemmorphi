import * as anchor from '@coral-xyz/anchor';

import { Keypair, PublicKey } from '@solana/web3.js';
import { assert } from 'chai';
import { Hemmorphi } from '../target/types/hemmorphi';
import { generateRandomQrData, TOKENS } from './utils';

describe('Hemmorphi Program', () => {
  // Set up provider (localnet in this case)
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.Hemmorphi as anchor.Program<Hemmorphi>;
  let user: Keypair; // User account
  const name = 'TestUser'; // Name to initialize user with

  // The user's PDA (Program Derived Address)
  let userPda: PublicKey;

  beforeEach(async () => {
    // Generate a new user account
    user = Keypair.generate();

    // Fund the user account with SOL
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      1000000000
    );
    const blockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    });
    assert.equal(
      await provider.connection.getBalance(user.publicKey),
      1000000000
    );

    // Find the PDA associated with the user
    [userPda] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode('user'), user.publicKey.toBuffer()],
      program.programId
    );
  });

  const initializeUser = async (name: string) => {
    // Initialize the user by calling the program's `initialize_user` function
    await program.methods
      .initializeUser(name)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();
  };

  it('Initializes a user', async () => {
    // Initialize the user by calling the program's `initialize_user` function
    await program.methods
      .initializeUser(name)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Fetch the user account to verify initialization
    const userAccount = await program.account.user.fetch(userPda);

    // Verify the name and authority
    assert.equal(userAccount.name, name);
    assert.equal(userAccount.authority.toString(), user.publicKey.toString());
    assert.deepEqual(userAccount.qrs, []); // Ensure the list of QR codes is empty
  });

  it('Fails to initialize user with a name that is too long', async () => {
    const longName = 'A'.repeat(33); // Name longer than the allowed max length (32 chars)

    // Try to initialize the user with the long name
    try {
      await program.methods
        .initializeUser(longName)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for name being too long');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'NameTooLong');
    }
  });

  it('Adds a QR code to the user', async () => {
    await initializeUser(name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Add the QR code to the user
    await program.methods
      .addUserQr(qrData)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Fetch the user account to verify the QR code was added
    const userAccount = await program.account.user.fetch(userPda);

    // Verify the QR code was added
    assert.equal(userAccount.qrs.length, 1);
    assert.equal(userAccount.qrs[0].hash, qrData.hash);
    assert.isTrue(userAccount.qrs[0].amount.eq(qrData.amount));
    assert.deepEqual(userAccount.qrs[0].tokens, qrData.tokens);
  });

  it('Fails to add more than 5 QRs', async () => {
    await initializeUser(name);

    // Add 10 QR codes (the maximum allowed)
    for (let i = 0; i < 5; i++) {
      const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use
      await program.methods
        .addUserQr(qrData)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();
    }

    // Try to add another QR code
    try {
      const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

      await program.methods
        .addUserQr(qrData)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for adding more than 10 QRs');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'QrListFull');
    }
  });

  it('Fails to add a QR code if it already exists', async () => {
    await initializeUser(name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Add the QR code to the user
    await program.methods
      .addUserQr(qrData)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Try to add the same QR code again
    try {
      await program.methods
        .addUserQr(qrData)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for adding the same QR code');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'QrAlreadyExists');
    }
  });

  it('Fails to add a QR code if is too many tokens', async () => {
    await initializeUser(name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Try to add a QR code with too many tokens
    try {
      const qrDataWithTooManyTokens = {
        ...qrData,
        tokens: [...TOKENS, TOKENS[0]], // Add an extra token
      };

      await program.methods
        .addUserQr(qrDataWithTooManyTokens)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for adding too many tokens');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'TooManyTokens');
    }
  });

  it('Fails to add a QR code if tokens are repeated', async () => {
    await initializeUser(name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Try to add a QR code with repeated tokens
    try {
      const qrDataWithRepeatedTokens = {
        ...qrData,
        tokens: [TOKENS[0], TOKENS[0]], // Repeat the first token
      };

      await program.methods
        .addUserQr(qrDataWithRepeatedTokens)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for adding repeated tokens');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'QrRepeatedTokens');
    }
  });

  it('Removes a QR code from the user', async () => {
    await initializeUser(name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Add the QR code to the user
    await program.methods
      .addUserQr(qrData)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Remove the QR code from the user
    await program.methods
      .removeUserQr(qrData.hash)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Fetch the user account to verify the QR code was removed
    const userAccount = await program.account.user.fetch(userPda);

    // Verify the QR code was removed
    assert.equal(userAccount.qrs.length, 0);
  });

  it('Fails to remove a QR code that does not exist', async () => {
    await initializeUser(name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Try to remove a QR code that does not exist
    try {
      await program.methods
        .removeUserQr(qrData.hash)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for removing a non-existent QR code');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'QrNotFound');
    }
  });
});
