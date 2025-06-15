import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { info, error as logError } from "../../utils/logger";

// ──────────────────── Configuration ──────────────────────────────────────────────
//   SOLANA_CLUSTER_URL=https://api.devnet.solana.com
//   REWARD_SECRET_KEY=[<JSON‐array from solana‐keygen>]

if (!process.env.SOLANA_CLUSTER_URL) {
  logError("Missing SOLANA_CLUSTER_URL in .env");
}

if (!process.env.REWARD_SECRET_KEY) {
  logError("Missing REWARD_SECRET_KEY in .env");
}

const SOLANA_CLUSTER_URL = process.env.SOLANA_CLUSTER_URL || "https://api.devnet.solana.com";
const REWARD_WALLET_SECRET = process.env.REWARD_SECRET_KEY
  ? Uint8Array.from(JSON.parse(process.env.REWARD_SECRET_KEY))
  : undefined;
const REWARD_WALLET = REWARD_WALLET_SECRET ? Keypair.fromSecretKey(REWARD_WALLET_SECRET) : undefined;

const MIN_VALID_VOTES = process.env.MIN_VALID_VOTES ? Number(process.env.MIN_VALID_VOTES) : 5; // Minimum valid votes to qualify for rewards
const BASE_REWARD_SOL = process.env.BASE_REWARD_SOL ? Number(process.env.BASE_REWARD_SOL) : 0.01; // Maximum reward in SOL (at 100% valid ratio)

export class ValidatorRewards {
  private connection: Connection;
  private rewardWallet: Keypair | undefined;

  constructor() {
    this.connection = new Connection(SOLANA_CLUSTER_URL, "confirmed");
    this.rewardWallet = REWARD_WALLET;
  }

  /**
   * Reward a validator in SOL based on valid votes.
   *
   * @param validatorPublicKey   The validators public key (string)
   * @param voteCount            Total votes cast by the validator in the round
   * @param validVotes           Valid votes confirmed by aggregator
   * @returns                    Transaction signature or null on error
   */
  public async rewardValidator(
    validatorPublicKey: string,
    voteCount: number,
    validVotes: number
  ): Promise<string | null> {
    if (!validatorPublicKey || voteCount <= 0 || validVotes <= 0) {
      logError(
        `Invalid input to rewardValidator: validatorPublicKey=${validatorPublicKey}, voteCount=${voteCount}, validVotes=${validVotes}`
      );
      return null;
    }
    if (!this.rewardWallet) {
      logError("Reward wallet is not initialized");
      return null;
    }

    // Enforce minimum valid votes threshold
    if (validVotes < MIN_VALID_VOTES) {
      logError(
        `Validator ${validatorPublicKey} did not meet minimum valid votes (${validVotes} < ${MIN_VALID_VOTES})`
      );
      return null;
    }

    // Calculate proportional reward
    const validRatio = Math.min(1, validVotes / voteCount);
    const rawRewardSol = BASE_REWARD_SOL * validRatio;

    // Covert to lamports (always integer)
    const lamportsToSend = Math.max(1, Math.floor(rawRewardSol * LAMPORTS_PER_SOL));

    // Check aggregator wallet balance to prevent failed tx
    let walletBalance = 0;
    try {
      walletBalance = await this.connection.getBalance(this.rewardWallet.publicKey);
    } catch (err) {
      logError(`Failed to fetch reward wallet balance: ${err}`);
      return null;
    }
    if (walletBalance < lamportsToSend + 5000) {
      logError(
        `Insufficient funds: reward wallet has ${walletBalance} lamports, but needs at least ${lamportsToSend + 5000} lamports (including fees)`
      );
      return null;
    }

    // Build transaction
    let signature: string | null = null;
    try {
      const validatorPK = new PublicKey(validatorPublicKey);
      const transferIx = SystemProgram.transfer({
        fromPubkey: this.rewardWallet.publicKey,
        toPubkey: validatorPK,
        lamports: lamportsToSend,
      });
      const tx = new Transaction().add(transferIx);
      tx.feePayer = this.rewardWallet.publicKey;
      const { blockhash } = await this.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.sign(this.rewardWallet);
      signature = await sendAndConfirmTransaction(this.connection, tx, [this.rewardWallet]);
      info(
        `✅ Sent ${lamportsToSend} lamports (${(lamportsToSend / LAMPORTS_PER_SOL).toFixed(6)} SOL) to ${validatorPublicKey} [Tx: ${signature}]`
      );
    } catch (err) {
      logError(`Failed to send reward to ${validatorPublicKey}: ${err}`);
      return null;
    }
    return signature;
  }

  /**
   * Get the SOL balance of a validator wallet.
   *
   * @param validatorPublicKey  The validator's public key (string)
   * @returns                   Balance in SOL or null on error
   */
  public async getValidatorBalance(validatorPublicKey: string): Promise<number | null> {
    if (!validatorPublicKey) {
      logError("Validator public key is required");
      return null;
    }
    try {
      const lamports = await this.connection.getBalance(new PublicKey(validatorPublicKey));
      return lamports / LAMPORTS_PER_SOL;
    } catch (err) {
      logError(`Failed to fetch validator balance for ${validatorPublicKey}: ${err}`);
      return null;
    }
  }
}
