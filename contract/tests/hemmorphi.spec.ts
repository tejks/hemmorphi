import * as anchor from '@coral-xyz/anchor';

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintToChecked,
} from '@solana/spl-token';
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import { assert } from 'chai';
import { Hemmorphi } from '../target/types/hemmorphi';
import {
  findQrAccountAddress,
  findUserAccountAddress,
  findUserStatsAccountAddress,
  generateRandomQrData,
  getQrAccountFilter,
  TOKENS,
} from './utils';

const TRANSFER_FEE = new anchor.BN(5000);

describe('Hemmorphi Program', () => {
  // Set up provider (localnet in this case)
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const connection = provider.connection;

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

  const createUser = async () => {
    const user = Keypair.generate();

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

    return user;
  };

  const initializeUser = async (user: Keypair, name: string) => {
    await program.methods
      .initializeUser(name)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();
  };

  const initializeUserStats = async (user: Keypair) => {
    await program.methods
      .initializeUserStats()
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();
  };

  const initializeUserQr = async (
    user: Keypair,
    qrData: {
      hash: string;
      amount: anchor.BN;
      tokens: anchor.web3.PublicKey[];
    }
  ) => {
    await program.methods
      .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();
  };

  const createTokenAndMintToUser = async (user: Keypair) => {
    const mint = await createMint(
      connection,
      user,
      user.publicKey,
      user.publicKey,
      6
    );

    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      user.publicKey
    );

    assert.equal(associatedTokenAccount.amount.toString(), '0');

    await mintToChecked(
      connection,
      user,
      mint,
      associatedTokenAccount.address,
      user,
      1000000,
      6
    );

    const beforeAssociatedTokenBalance =
      await connection.getTokenAccountBalance(associatedTokenAccount.address);

    assert.equal(beforeAssociatedTokenBalance.value.amount, '1000000');

    return { mint, associatedTokenAccount };
  };

  const getQrAccountsByAuthority = async (programId: PublicKey) => {
    const accounts = await provider.connection.getProgramAccounts(programId, {
      filters: getQrAccountFilter(user.publicKey),
    });

    return accounts.map(({ pubkey, account }) => {
      return {
        pubkey,
        lamports: account.lamports,
        data: account.data,
      };
    });
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
    assert.deepEqual(userAccount.hashes, []); // Ensure the list of QR codes is empty
  });

  it('Fails to initialize user if already initialized', async () => {
    // Initialize the user
    await program.methods
      .initializeUser(name)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Try to initialize the user again
    try {
      await program.methods
        .initializeUser(name)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for initializing user twice');
    } catch (err) {
      assert.equal(
        err.transactionMessage,
        'Transaction simulation failed: Error processing Instruction 0: custom program error: 0x0'
      );
    }
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

  it('Removes a user', async () => {
    await initializeUser(user, name);

    // Remove the user
    await program.methods
      .removeUser()
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    try {
      await program.account.user.fetch(userPda);
      assert.fail('Expected error for fetching removed user');
    } catch (err) {
      assert.include(
        String(err),
        'Error: Account does not exist or has no data'
      );
    }
  });

  it('Initializes user stats', async () => {
    await initializeUser(user, name);

    await program.methods
      .initializeUserStats()
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );
    const userStats = await program.account.userStats.fetch(userStatsAddress);

    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));
    assert.isTrue(userStats.lastActiveTimestamp.eq(new anchor.BN(0)));
    assert.isTrue(userStats.qrCodesCreated.eq(new anchor.BN(0)));
    assert.equal(userStats.authority.toString(), user.publicKey.toString());
  });

  it('Fails to initialize user stats if already initialized', async () => {
    await initializeUser(user, name);

    await program.methods
      .initializeUserStats()
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Try to initialize user stats again
    try {
      await program.methods
        .initializeUserStats()
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for initializing user stats twice');
    } catch (err) {
      assert.equal(
        err.transactionMessage,
        'Transaction simulation failed: Error processing Instruction 0: custom program error: 0x0'
      );
    }
  });

  it('Fails to initialize user stats if user is not initialized', async () => {
    // Try to initialize user stats without initializing the user
    try {
      await program.methods
        .initializeUserStats()
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail(
        'Expected error for initializing user stats without initializing the user'
      );
    } catch (err) {
      assert.include(err.error.errorCode.code, 'AccountNotInitialized');
    }
  });

  it('Removes user stats', async () => {
    await initializeUser(user, name);

    await program.methods
      .initializeUserStats()
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    await program.methods
      .removeUserStats()
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    try {
      await program.account.userStats.fetch(userStatsAddress);
      assert.fail('Expected error for fetching removed user stats');
    } catch (err) {
      assert.include(
        String(err),
        'Error: Account does not exist or has no data'
      );
    }
  });

  it('Adds a QR code to the user', async () => {
    await initializeUser(user, name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Add the QR code to the user
    await program.methods
      .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Fetch the user account to verify the QR code was added
    const userAccount = await program.account.user.fetch(userPda);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);

    // Verify the QR code was added
    assert.equal(userAccount.hashes.length, 1);
    assert.equal(userAccount.hashes[0], qrData.hash);

    // Verify the QR code data
    assert.equal(qrAccount.amount.toString(), qrData.amount.toString());
    assert.deepEqual(qrAccount.tokens, qrData.tokens);
    assert.isTrue(qrAccount.lastTransferTimestamp.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats.length === qrData.tokens.length);
    for (const tokenStats of qrAccount.tokensStats) {
      assert.isTrue(tokenStats.transferCount.eq(new anchor.BN(0)));
      assert.isTrue(tokenStats.totalAmount.eq(new anchor.BN(0)));
      assert.isTrue(tokenStats.totalValue.eq(new anchor.BN(0)));
    }
    assert.equal(qrAccount.authority.toString(), user.publicKey.toString());
    assert.equal(qrAccount.hash, qrData.hash);
  });

  it('Add multiple QR codes to the user', async () => {
    await initializeUser(user, name);

    // Add 5 QR codes
    for (let i = 0; i < 5; i++) {
      const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use
      await program.methods
        .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      // Fetch the user account to verify the QR code was added
      const userAccount = await program.account.user.fetch(userPda);

      // Verify the QR code was added
      assert.equal(userAccount.hashes.length, i + 1);

      // Verify the QR code data
      const qrAccountAddress = findQrAccountAddress(
        program.programId,
        userPda,
        qrData.hash
      );

      const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
      assert.equal(qrAccount.amount.toString(), qrData.amount.toString());
      assert.deepEqual(qrAccount.tokens, qrData.tokens);
      assert.isTrue(qrAccount.lastTransferTimestamp.eq(new anchor.BN(0)));
      assert.isTrue(qrAccount.tokensStats.length === qrData.tokens.length);
      for (const tokenStats of qrAccount.tokensStats) {
        assert.isTrue(tokenStats.transferCount.eq(new anchor.BN(0)));
        assert.isTrue(tokenStats.totalAmount.eq(new anchor.BN(0)));
        assert.isTrue(tokenStats.totalValue.eq(new anchor.BN(0)));
      }
      assert.equal(qrAccount.authority.toString(), user.publicKey.toString());
      assert.equal(qrAccount.hash, qrData.hash);
    }
  });

  it('Fails to add more than 5 QRs', async () => {
    await initializeUser(user, name);

    // Add 5 QR codes (the maximum allowed)
    for (let i = 0; i < 5; i++) {
      const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use
      await program.methods
        .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();
    }

    // const data = await getQrAccountsByAuthority(program.programId);

    // for (const qr of data) {
    //   console.log(
    //     qr.pubkey.toBase58(),
    //     program.coder.accounts.decode<QrAccount>('qrAccount', qr.data)
    //   );
    // }

    try {
      const qrData = generateRandomQrData(user.publicKey);

      await program.methods
        .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
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
    await initializeUser(user, name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Add the QR code to the user
    await program.methods
      .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Try to add the same QR code again
    try {
      await program.methods
        .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
        .accounts({
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail('Expected error for adding the same QR code');
    } catch {}
  });

  it('Fails to add a QR code if is too many tokens', async () => {
    await initializeUser(user, name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Try to add a QR code with too many tokens
    try {
      const qrDataWithTooManyTokens = {
        ...qrData,
        tokens: [...TOKENS, TOKENS[0]], // Add an extra token
      };

      await program.methods
        .initializeUserQr(
          qrDataWithTooManyTokens.hash,
          qrDataWithTooManyTokens.amount,
          qrDataWithTooManyTokens.tokens
        )
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
    await initializeUser(user, name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Try to add a QR code with repeated tokens
    try {
      const qrDataWithRepeatedTokens = {
        ...qrData,
        tokens: [TOKENS[0], TOKENS[0]], // Repeat the first token
      };

      await program.methods
        .initializeUserQr(
          qrDataWithRepeatedTokens.hash,
          qrDataWithRepeatedTokens.amount,
          qrDataWithRepeatedTokens.tokens
        )
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
    await initializeUser(user, name);
    const qrData = generateRandomQrData(user.publicKey); // Generate a QR code to use

    // Add the QR code to the user
    await program.methods
      .initializeUserQr(qrData.hash, qrData.amount, qrData.tokens)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );

    // Verify the QR code was added
    assert.ok(await program.account.qrAccount.fetch(qrAccountAddress));
    const userAccountBefore = await program.account.user.fetch(userPda);
    assert.equal(userAccountBefore.hashes.length, 1);

    // Remove the QR code from the user
    await program.methods
      .removeUserQr(qrData.hash)
      .accounts({
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    try {
      await program.account.qrAccount.fetch(qrAccountAddress);
    } catch (err) {
      assert.include(
        String(err),
        'Error: Account does not exist or has no data'
      );
    }

    // Fetch the user account to verify the QR code was removed
    const userAccount = await program.account.user.fetch(userPda);

    // Verify the QR code was removed
    assert.equal(userAccount.hashes.length, 0);
  });

  it('Fails to remove a QR code that does not exist', async () => {
    await initializeUser(user, name);
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
      assert.include(err.error.errorCode.code, 'AccountNotInitialized');
    }
  });

  it('Successfully transfer SPL token', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Create a token and mint to the first user
    const { associatedTokenAccount: fromUserAssociatedTokenAccount, mint } =
      await createTokenAndMintToUser(fromUser);

    // Create a token account for the second user
    const toUserAssociatedTokenAccount =
      await getOrCreateAssociatedTokenAccount(
        connection,
        toUser,
        mint,
        toUser.publicKey
      );

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, mint);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    let qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    let userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Get the balance of the token account before the transfer
    const beforeAssociatedTokenBalance =
      await connection.getTokenAccountBalance(
        fromUserAssociatedTokenAccount.address
      );

    // Transfer the token
    const tx = new Transaction().add(
      await program.methods
        .qrTransferSpl(qrData.amount)
        .accounts({
          qrAccount: qrAccountAddress,
          userStats: userStatsAddress,
          from: fromUser.publicKey,
          source: fromUserAssociatedTokenAccount.address,
          destination: toUserAssociatedTokenAccount.address,
        })
        .instruction()
    );

    // Sign and send the transaction
    await sendAndConfirmTransaction(connection, tx, [fromUser]);

    // Get the balance of the token account after the transfer
    const afterAssociatedTokenBalance = await connection.getTokenAccountBalance(
      fromUserAssociatedTokenAccount.address
    );

    assert.equal(
      afterAssociatedTokenBalance.value.amount,
      new anchor.BN(beforeAssociatedTokenBalance.value.amount.toString())
        .sub(qrData.amount)
        .toString()
    );

    // Verify the QR code and user stats were updated
    qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(1)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(qrData.amount));

    userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(1)));
  });

  it('Fails when amount is greater than the balance (SPL transfer)', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Create a token and mint to the first user
    const { associatedTokenAccount: fromUserAssociatedTokenAccount, mint } =
      await createTokenAndMintToUser(fromUser);

    // Create a token account for the second user
    const toUserAssociatedTokenAccount =
      await getOrCreateAssociatedTokenAccount(
        connection,
        toUser,
        mint,
        toUser.publicKey
      );

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, mint);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    const userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Try to transfer more than the balance
    try {
      const tx = new Transaction().add(
        await program.methods
          .qrTransferSpl(qrData.amount)
          .accounts({
            qrAccount: qrAccountAddress,
            userStats: userStatsAddress,
            from: fromUser.publicKey,
            source: fromUserAssociatedTokenAccount.address,
            destination: toUserAssociatedTokenAccount.address,
          })
          .instruction()
      );

      await sendAndConfirmTransaction(connection, tx, [fromUser]);
      assert.fail('Expected error for transferring more than the balance');
    } catch (err) {
      assert.include(
        String(err),
        'Expected error for transferring more than the balance'
      );
    }
  });

  it('Fails when token amount is zero (SPL transfer)', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Create a token and mint to the first user
    const { associatedTokenAccount: fromUserAssociatedTokenAccount, mint } =
      await createTokenAndMintToUser(fromUser);

    // Create a token account for the second user
    const toUserAssociatedTokenAccount =
      await getOrCreateAssociatedTokenAccount(
        connection,
        toUser,
        mint,
        toUser.publicKey
      );

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, mint);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    const userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Try to transfer zero tokens
    try {
      await program.methods
        .qrTransferSpl(new anchor.BN(0))
        .accounts({
          qrAccount: qrAccountAddress,
          userStats: userStatsAddress,
          from: fromUser.publicKey,
          source: fromUserAssociatedTokenAccount.address,
          destination: toUserAssociatedTokenAccount.address,
        })
        .signers([fromUser])
        .rpc();

      assert.fail('Expected error for transferring zero tokens');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'TransferAmountZero');
    }
  });

  it('Fails when token does not exist in qr code (SPL transfer)', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Create a token and mint to the first user
    const { associatedTokenAccount: fromUserAssociatedTokenAccount, mint } =
      await createTokenAndMintToUser(fromUser);
    const { associatedTokenAccount: wrongTokenAccount } =
      await createTokenAndMintToUser(fromUser);

    // Create a token account for the second user
    const toUserAssociatedTokenAccount =
      await getOrCreateAssociatedTokenAccount(
        connection,
        toUser,
        mint,
        toUser.publicKey
      );

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, mint);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    const userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Try to transfer a token that does not exist in the QR code
    try {
      await program.methods
        .qrTransferSpl(qrData.amount)
        .accounts({
          qrAccount: qrAccountAddress,
          userStats: userStatsAddress,
          from: fromUser.publicKey,
          source: wrongTokenAccount.address,
          destination: toUserAssociatedTokenAccount.address,
        })
        .signers([fromUser])
        .rpc();

      assert.fail(
        'Expected error for transferring a token that does not exist'
      );
    } catch (err) {
      assert.include(err.error.errorCode.code, 'TokenNotExistsInQrAccount');
    }
  });

  it('Fails when wrong transfer amount (SPL transfer)', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Create a token and mint to the first user
    const { associatedTokenAccount: fromUserAssociatedTokenAccount, mint } =
      await createTokenAndMintToUser(fromUser);

    // Create a token account for the second user
    const toUserAssociatedTokenAccount =
      await getOrCreateAssociatedTokenAccount(
        connection,
        toUser,
        mint,
        toUser.publicKey
      );

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, mint);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    const userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Try to transfer a wrong amount
    try {
      await program.methods
        .qrTransferSpl(qrData.amount.add(new anchor.BN(1)))
        .accounts({
          qrAccount: qrAccountAddress,
          userStats: userStatsAddress,
          from: fromUser.publicKey,
          source: fromUserAssociatedTokenAccount.address,
          destination: toUserAssociatedTokenAccount.address,
        })
        .signers([fromUser])
        .rpc();

      assert.fail('Expected error for transferring a wrong amount');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'WrongTransferAmount');
    }
  });

  it('Fails when wrong transfer destination (SPL transfer)', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Create a token and mint to the first user
    const { associatedTokenAccount: fromUserAssociatedTokenAccount, mint } =
      await createTokenAndMintToUser(fromUser);

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, mint);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    const userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Try to transfer to the wrong destination
    try {
      await program.methods
        .qrTransferSpl(qrData.amount)
        .accounts({
          qrAccount: qrAccountAddress,
          userStats: userStatsAddress,
          from: fromUser.publicKey,
          source: fromUserAssociatedTokenAccount.address,
          destination: fromUserAssociatedTokenAccount.address,
        })
        .signers([fromUser])
        .rpc();

      assert.fail('Expected error for transferring to the wrong destination');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'WrongTransferDestination');
    }
  });

  it('Fails when wrong transfer source (SPL transfer)', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Create a token and mint to the first user
    const { mint } = await createTokenAndMintToUser(fromUser);

    // Create a token account for the second user
    const toUserAssociatedTokenAccount =
      await getOrCreateAssociatedTokenAccount(
        connection,
        toUser,
        mint,
        toUser.publicKey
      );

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, mint);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    const qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    const userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Try to transfer from the wrong source
    try {
      await program.methods
        .qrTransferSpl(qrData.amount)
        .accounts({
          qrAccount: qrAccountAddress,
          userStats: userStatsAddress,
          from: fromUser.publicKey,
          source: toUserAssociatedTokenAccount.address,
          destination: toUserAssociatedTokenAccount.address,
        })
        .signers([fromUser])
        .rpc();

      assert.fail('Expected error for transferring from the wrong source');
    } catch (err) {
      assert.include(err.error.errorCode.code, 'ConstraintRaw');
    }
  });

  it('Successfully transfer lamports', async () => {
    // Create two users
    const fromUser = await createUser();
    const toUser = await createUser();

    // Fund the first user with SOL
    const signature = await provider.connection.requestAirdrop(
      fromUser.publicKey,
      1000000000
    );
    const blockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    });
    assert.equal(
      await provider.connection.getBalance(fromUser.publicKey),
      2000000000
    );

    // Initialize the users
    await initializeUser(toUser, name);
    // Initialize the user stats
    await initializeUserStats(toUser);
    // Generate a random QR code
    const qrData = generateRandomQrData(toUser.publicKey, TOKENS[4]);
    // Initialize the QR code
    await initializeUserQr(toUser, qrData);

    const userPda = findUserAccountAddress(program.programId, toUser.publicKey);
    const qrAccountAddress = findQrAccountAddress(
      program.programId,
      userPda,
      qrData.hash
    );
    const userStatsAddress = findUserStatsAccountAddress(
      program.programId,
      userPda
    );

    let qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(0)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(new anchor.BN(0)));

    let userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(0)));
    assert.isTrue(userStats.totalValueTransfered.eq(new anchor.BN(0)));

    // Get the balance of the token account before the transfer
    const beforeBalance = await provider.connection.getBalance(
      fromUser.publicKey
    );

    // Transfer the token
    const tx = new Transaction().add(
      await program.methods
        .qrTransferLamports(qrData.amount)
        .accounts({
          qrAccount: qrAccountAddress,
          userStats: userStatsAddress,
          from: fromUser.publicKey,
          to: toUser.publicKey,
        })
        .instruction()
    );

    // Sign and send the transaction
    await sendAndConfirmTransaction(connection, tx, [fromUser]);

    // Get the balance of the token account after the transfer
    const afterBalance = await provider.connection.getBalance(
      fromUser.publicKey
    );

    assert.equal(
      afterBalance,
      new anchor.BN(beforeBalance)
        .sub(qrData.amount)
        .sub(TRANSFER_FEE)
        .toNumber()
    );

    // Verify the QR code and user stats were updated
    qrAccount = await program.account.qrAccount.fetch(qrAccountAddress);
    assert.isTrue(qrAccount.tokensStats[0].transferCount.eq(new anchor.BN(1)));
    assert.isTrue(qrAccount.tokensStats[0].totalAmount.eq(qrData.amount));

    userStats = await program.account.userStats.fetch(userStatsAddress);
    assert.isTrue(userStats.totalTransfers.eq(new anchor.BN(1)));
  });
});
