import { tool } from "ai";
import { z } from "zod";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";

const gqlClient = new SuiGraphQLClient({
  url: "https://sui-mainnet.mystenlabs.com/graphql",
});

export const queryBlockchainTool = tool({
  description:
    "Query the Sui blockchain using GraphQL to get various information about epochs, transactions, and addresses, you should try display key information that is received not just talk about it, balance for sui native token is alrady in the context so dont try query it.",
  parameters: z.object({
    queryType: z
      .enum([
        "chainIdentifier",
        "addressInfo",
        "transactionInfo",
        "recentTransactions",
      ])
      .describe("Type of query to execute"),
    address: z
      .string()
      .optional()
      .describe(
        "Address to query information for (required for addressInfo)"
      ),
    epochId: z
      .number()
      .optional()
      .describe("Epoch ID to query (optional for epochInfo)"),
    transactionDigest: z
      .string()
      .optional()
      .describe(
        "Transaction digest to query (required for transactionInfo)"
      ),
  }),
  execute: async (args) => {
    switch (args.queryType) {
      case "chainIdentifier": {
        const query = graphql(`
          query {
            chainIdentifier
          }
        `);
        const result = await gqlClient.query({ query });
        return { chainIdentifier: result.data?.chainIdentifier };
      }

      case "addressInfo": {
        if (!args.address)
          throw new Error("Address is required for addressInfo query");
        const query = graphql(`
          query getAddressInfo($address: SuiAddress!) {
            address(address: $address) {
              defaultSuinsName
            }
          }
        `);
        const result = await gqlClient.query({
          query,
          variables: { address: args.address },
        });
        return {
          defaultSuinsName: result.data?.address?.defaultSuinsName,
        };
      }

      case "transactionInfo": {
        if (!args.transactionDigest)
          throw new Error("Transaction digest is required");
        const query = graphql(`
          query getTransactionInfo($digest: String!) {
            transactionBlock(digest: $digest) {
              gasInput {
                gasSponsor {
                  address
                }
                gasPrice
                gasBudget
              }
              effects {
                status
                timestamp
                checkpoint {
                  sequenceNumber
                }
                epoch {
                  epochId
                  referenceGasPrice
                }
              }
            }
          }
        `);
        const result = await gqlClient.query({
          query,
          variables: { digest: args.transactionDigest },
        });
        return result.data?.transactionBlock;
      }

      case "recentTransactions": {
        const query = graphql(`
          query {
            transactionBlocks(
              last: 10
              filter: { kind: PROGRAMMABLE_TX }
            ) {
              nodes {
                digest
                kind {
                  __typename
                }
              }
            }
          }
        `);
        const result = await gqlClient.query({ query });
        return result.data?.transactionBlocks?.nodes;
      }
    }
  },
}); 