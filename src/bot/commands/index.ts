import { teleBot } from "@/index";
import { startBot } from "./start";
import { log, errorHandler } from "@/utils/handlers";
import { settings } from "./settings";
import { setEmojiCommand } from "./setEmoji";
import { stopBot } from "./stop";
import { setMediaCommand } from "./setMedia";
import { executeStep } from "../executeStep";

export function initiateBotCommands() {
  teleBot.api
    .setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "stop", description: "Stop the bot" },
      { command: "settings", description: "To customize the bot" },
      { command: "setemoji", description: "To set an emoji" },
      { command: "setmedia", description: "To set a GIF" },
    ])
    .catch((e) => errorHandler(e));

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("stop", (ctx) => stopBot(ctx));
  teleBot.command("settings", (ctx) => settings(ctx));
  teleBot.command("setemoji", (ctx) => setEmojiCommand(ctx));
  teleBot.command("setmedia", (ctx) => setMediaCommand(ctx));

  // @ts-expect-error CTX type invalid
  teleBot.on(["message"], (ctx) => executeStep(ctx));

  log("Bot commands up");
}
