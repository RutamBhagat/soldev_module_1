"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DelegateTokenSchema, delegateTokenSchema } from "@/types/ZDelegateToken";
import { PublicKey, Transaction } from "@solana/web3.js";
import { createApproveInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuccessMessage } from "../SuccessMessage";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function DelegateToken({
  mintAddress,
  setMintAddress,
}: {
  mintAddress: string;
  setMintAddress: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DelegateTokenSchema>({
    resolver: zodResolver(delegateTokenSchema),
    defaultValues: {
      tokenMintAddress: mintAddress || "",
      amount: 1,
    },
  });

  const onSubmit = async (data: DelegateTokenSchema) => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const mintPublicKey = new PublicKey(data.tokenMintAddress);
      const delegatePublicKey = new PublicKey(data.delegateAddress);

      // Get the associated token account for the connected wallet
      const associatedTokenAddress = await getAssociatedTokenAddress(mintPublicKey, publicKey);

      // Calculate the amount to delegate using the correct decimals
      const mintInfo = await getMint(connection, mintPublicKey);
      const amountToDelegate = BigInt(Math.floor(data.amount * Math.pow(10, mintInfo.decimals)));

      const transaction = new Transaction();

      // Add the approve (delegate) instruction
      transaction.add(createApproveInstruction(associatedTokenAddress, delegatePublicKey, publicKey, amountToDelegate));

      // Send the transaction
      const signature = await sendTransaction(transaction, connection);

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      });

      const link = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      console.log(`You can view your transaction on Solana Explorer at:\n${link}`);

      toast.success(<SuccessMessage explorerLink={link} transactionMessage={"Token Authority Delegated"} />, {
        duration: 3000,
      });
      reset();
    } catch (error) {
      console.error("Transaction failed:", error);
      toast.error("Transaction failed. Please try again.");
    }
  };

  return (
    <Card>
      <CardContent className="grid gap-6 pt-6">
        <div className="grid gap-2 md:min-w-[500px]">
          <Label htmlFor="token-mint">Token Mint</Label>
          <Input
            id="token-mint"
            placeholder="EB9oi8BZA5RkKxd7VzwUt6JQF2W2UNniCzBj7T3gx44P"
            {...register("tokenMintAddress", {
              onChange: (e) => setMintAddress(e.target.value),
            })}
            className={errors.tokenMintAddress ? "border-red-500" : ""}
          />
          {errors.tokenMintAddress && <span className="text-red-500">{errors.tokenMintAddress.message}</span>}
        </div>
        <div className="grid gap-2 md:min-w-[500px]">
          <Label htmlFor="delegate-address">Delegate Address</Label>
          <Input
            id="delegate-address"
            placeholder="JCZjJcmuWidrj5DwuJBxwqHx7zRfiBAp6nCLq3zYmBxd"
            {...register("delegateAddress")}
            className={errors.delegateAddress ? "border-red-500" : ""}
          />
          {errors.delegateAddress && <span className="text-red-500">{errors.delegateAddress.message}</span>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount of tokens to delegate</Label>
          <Input
            id="amount"
            placeholder="100"
            {...register("amount", { valueAsNumber: true })}
            className={errors.amount ? "border-red-500" : ""}
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
          Delegate Token Authority
        </Button>
      </CardFooter>
    </Card>
  );
}
