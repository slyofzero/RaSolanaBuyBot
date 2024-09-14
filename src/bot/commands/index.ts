import { teleBot } from "@/index";
import { startBot } from "./start";
import { log, errorHandler } from "@/utils/handlers";
import { settings } from "./settings";
import { stopBot } from "./stop";
import { executeStep } from "../executeStep";

export function initiateBotCommands() {
  teleBot.api
    .setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "stop", description: "Stop the bot" },
      { command: "settings", description: "To customize the bot" },
      { command: "setup", description: "To setup the buybot" },
    ])
    .catch((e) => errorHandler(e));

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("stop", (ctx) => stopBot(ctx));
  teleBot.command("settings", (ctx) => settings(ctx));

  // @ts-expect-error CTX type invalid
  teleBot.on(["message"], (ctx) => executeStep(ctx));

  log("Bot commands up");
}
