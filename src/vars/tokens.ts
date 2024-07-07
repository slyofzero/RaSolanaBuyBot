import { PairData, PairsData } from "@/types";
import { apiFetcher } from "@/utils/api";
import { log } from "@/utils/handlers";

export const memoTokenData: { [key: string]: PairData } = {};
export let pairsToWatch: string[] = [];
export function setPairsToWatch(newPairsToWatch: string[]) {
  pairsToWatch = newPairsToWatch;
}

export async function memoizeTokenData(tokens: string[]) {
  log("Memoizing token data...");

  for (const token of tokens) {
    try {
      const tokenData = await apiFetcher<PairsData>(
        `https://api.dexscreener.com/latest/dex/tokens/${token}`
      );
      const data = tokenData?.data.pairs?.at(0);
      const tokenAddress = data?.baseToken.address;

      if (tokenAddress) {
        memoTokenData[tokenAddress] = data;
      }
    } catch (error) {
      continue;
    }
  }

  const newPairsToWatch = Object.values(memoTokenData).map(
    ({ pairAddress }) => pairAddress
  );
  setPairsToWatch(newPairsToWatch);
}
