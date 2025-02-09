import { tool } from "ai";
import { z } from "zod";
import { instantiateAccount, suiClient } from "../sui";
import { LstClient } from "@suilend/springsui-sdk";
import { Transaction } from "@mysten/sui/transactions";

export const liquidStakingTool = tool({
  description: "Mint or redeem sSUI tokens using Spring protocol",
  parameters: z.object({
    action: z
      .enum(["mint", "redeem"])
      .describe("Whether to mint or redeem sSUI"),
    amount: z.number().describe("Amount in MIST units"),
  }),
  execute: async (args: {
    action: "mint" | "redeem";
    amount: number;
  }) => {
    const LIQUID_STAKING_INFO = {
      id: "0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b",
      type: "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
      weightHookId:
        "0xbbafcb2d7399c0846f8185da3f273ad5b26b3b35993050affa44cfa890f1f144",
    };

    const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
    const lstClient = await LstClient.initialize(
      suiClient,
      LIQUID_STAKING_INFO
    );

    const tx = new Transaction();

    if (args.action === "mint") {
      const mistAmount = Math.floor(args.amount);
      const [sui] = tx.splitCoins(tx.gas, [mistAmount]);
      const sSui = lstClient.mint(tx, sui);
      tx.transferObjects([sSui], keypair.toSuiAddress());
    } else {
      const lstCoins = await suiClient.getCoins({
        owner: keypair.toSuiAddress(),
        coinType: LIQUID_STAKING_INFO.type,
        limit: 1000,
      });

      if (lstCoins.data.length > 1) {
        tx.mergeCoins(
          lstCoins.data[0].coinObjectId,
          lstCoins.data.slice(1).map((c) => c.coinObjectId)
        );
      }

      const mistAmount = Math.floor(args.amount);
      const [lst] = tx.splitCoins(lstCoins.data[0].coinObjectId, [mistAmount]);
      const sui = lstClient.redeem(tx, lst);
      tx.transferObjects([sui], keypair.toSuiAddress());
    }

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEvents: true,
        showEffects: true,
        showObjectChanges: true,
      },
    });

    return {
      success: true,
      transactionId: result.digest,
      action: args.action,
    };
  },
}); 