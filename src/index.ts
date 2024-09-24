import { Bot } from "grammy";
import { initiateBotCommands, initiateCallbackQueries } from "./bot";
import { log, stopScript } from "./utils/handlers";
import { BOT_TOKEN, LOG_CHANNEL_ID, TRENDING_BOT_TOKENS } from "./utils/env";
import { syncAdvertisements } from "./vars/advertisements";
import { rpcConfig } from "./rpc/config";
import { cleanUpExpired } from "./bot/cleanup";
import { unlockUnusedAccounts } from "./bot/cleanup/account";
import { projectGroups, syncProjectGroups } from "./vars/projectGroups";
import { memoizeTokenData } from "./vars/tokens";
import { syncTrendingTokens } from "./vars/trending";
import { syncTrendingMessageId } from "./vars/message";

if (!BOT_TOKEN) {
  stopScript("BOT_TOKEN is missing.");
}

export const teleBot = new Bot(BOT_TOKEN || "");
export const trendingBuyAlertBots = TRENDING_BOT_TOKENS.map(
  (token) => new Bot(token)
);
log("Bot instance ready");

(async function () {
  rpcConfig();
  teleBot.start();
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  await memoizeTokenData(projectGroups.map(({ token }) => token));
  await Promise.all([
    syncAdvertisements(),
    syncProjectGroups(),
    syncTrendingTokens(),
    syncTrendingMessageId(),
  ]);

  // Recurse functions
  setInterval(
    async () => await memoizeTokenData(projectGroups.map(({ token }) => token)),
    7 * 1e3
  );
  setInterval(
    async () =>
      await Promise.all([syncTrendingTokens(), syncTrendingMessageId()]),
    60 * 1e3
  );

  setInterval(() => {
    const toLog = projectGroups.map(({ token }) => token);

    teleBot.api.sendMessage(
      LOG_CHANNEL_ID || "",
      `Buybot watching -\n${JSON.stringify(toLog, null, 2)}`
    );
  }, 10 * 60 * 1e3);

  setInterval(unlockUnusedAccounts, 60 * 60 * 1e3);
  setInterval(cleanUpExpired, 60 * 1e3);
})();
