import { log } from "@/utils/handlers";
import { projectGroups } from "./projectGroups";
import { currentWSS, setUpWSS } from "@/setupWSS";
import { memoizeTokenData } from "./tokens";

export const pairsToWatch: string[] = [];
export const tokensToWatch: string[] = [];

export async function syncPairsToWatch() {
  projectGroups.forEach(({ token, pairs }) => {
    pairsToWatch.push(...pairs);
    tokensToWatch.push(token);
  });

  if (currentWSS) {
    log("Reset WSS");
    currentWSS.close(4200, "Reset WSS");
  }

  await memoizeTokenData(tokensToWatch);
  setUpWSS(pairsToWatch);
  log(`Synced all pairs to watch`);
}
