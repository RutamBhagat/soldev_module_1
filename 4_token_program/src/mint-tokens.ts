import "dotenv/config";

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";

import { mintTo } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
});

// Our token has two decimal places
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);

const user = getKeypairFromEnvironment("SECRET_KEY");

// Subtitute in your token mint account from create-token-mint.ts
const tokenMintAccount = new PublicKey(
  process.env.TOKEN_MINT_ADDRESS as string
);

// Substitute in your own, or a friend's token account address, based on the previous step.
const recipientAssociatedTokenAccount = new PublicKey(
  process.env.ATA_ADDRESS as string
);

const transactionSignature = await mintTo(
  connection,
  user,
  tokenMintAccount,
  recipientAssociatedTokenAccount,
  user,
  10 * MINOR_UNITS_PER_MAJOR_UNITS
);

const link = getExplorerLink("transaction", transactionSignature, "devnet");

console.log(`✅ Success! Mint Token Transaction: ${link}`);
