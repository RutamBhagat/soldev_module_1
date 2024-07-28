"use client";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMintToInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { Card, CardContent, CardFooter } from "./ui/card";
import { ConfirmOptions, PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import SolanaBalance from "./SolanaBalance";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const amountSchema = z.string().regex(/^\d*\.?\d*$/, { message: "Invalid amount format" });
const addressSchema = z
  .string()
  .length(44, { message: "Invalid Solana address format" })
  .refine(
    (value) => {
      try {
        new PublicKey(value);
        return true;
      } catch (error) {
        return false;
      }
    },
    { message: "Invalid Solana address format" }
  );

const mintTokenSchema = z.object({
  amount: amountSchema,
  tokenMintAddress: addressSchema,
  recipientAddress: addressSchema,
});

type MintTokenSchema = z.infer<typeof mintTokenSchema>;

export function MintToken() {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const { connection } = useConnection();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MintTokenSchema>({
    resolver: zodResolver(mintTokenSchema),
  });

  const [tokenMint, setTokenMint] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);

  const onSubmit = async (data: MintTokenSchema) => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    const tokenMintPublicKey = new PublicKey(data.tokenMintAddress);
    const recipientPublicKey = new PublicKey(data.recipientAddress);
    const amountToMint = parseFloat(data.amount) * Math.pow(10, 9); // Assuming 9 decimals for the token

    try {
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        recipientPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction().add(
        createMintToInstruction(
          tokenMintPublicKey,
          associatedTokenAddress,
          publicKey,
          amountToMint,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signature = await sendTransaction(transaction, connection, { signers: [] });
      await connection.confirmTransaction(signature, "processed");

      toast.success("Tokens minted successfully");
      reset();
    } catch (error) {
      console.error("Transaction failed:", error);
      toast.error("Transaction failed. Please try again.");
    }
  };

  return (
    <Card>
      <SolanaBalance />
      <CardContent className="grid gap-6">
        <div className="grid gap-2 md:min-w-[500px]">
          <Label htmlFor="token-mint">Token Mint</Label>
          <Input
            id="token-mint"
            placeholder="J2SFddenUcPYrbc4U4EvvNbipAUnQ7hioXrnJo8ce8H3"
            {...register("tokenMintAddress")}
            className={errors.tokenMintAddress ? "border-red-500" : ""}
            onChange={(e) => setTokenMint(e.target.value)}
          />
          {errors.tokenMintAddress && <span className="text-red-500">{errors.tokenMintAddress.message}</span>}
        </div>
        <div className="grid gap-2 md:min-w-[500px]">
          <Label htmlFor="recipient-address">Recipient Address</Label>
          <Input
            id="recipient-address"
            placeholder="JCZjJcmuWidrj5DwuJBxwqHx7zRfiBAp6nCLq3zYmBxd"
            {...register("recipientAddress")}
            className={errors.recipientAddress ? "border-red-500" : ""}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
          {errors.recipientAddress && <span className="text-red-500">{errors.recipientAddress.message}</span>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount of tokens to mint</Label>
          <Input
            id="amount"
            placeholder="0.01"
            {...register("amount")}
            className={errors.amount ? "border-red-500" : ""}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <span className="text-red-500">{errors.amount.message}</span>}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-violet-900 hover:bg-violet-950"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          Mint Tokens
        </Button>
      </CardFooter>
    </Card>
  );
}