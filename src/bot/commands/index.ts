import { teleBot } from "@/index";
import { startBot } from "./start";
import { log, errorHandler } from "@/utils/handlers";
import { settings } from "./settings";
import { setEmojiCommand } from "./setEmoji";
import { stopBot } from "./stop";
import { setGifCommand } from "./setGif";
import { executeStep } from "../executeStep";
import { userState } from "@/vars/state";

export function initiateBotCommands() {
  teleBot.api
    .setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "stop", description: "Stop the bot" },
      { command: "settings", description: "To customize the bot" },
      { command: "setemoji", description: "To set an emoji" },
      { command: "setgif", description: "To set a GIF" },
    ])
    .catch((e) => errorHandler(e));

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("stop", (ctx) => stopBot(ctx));
  teleBot.command("settings", (ctx) => settings(ctx));
  teleBot.command("setemoji", (ctx) => setEmojiCommand(ctx));
  teleBot.command("setgif", (ctx) => setGifCommand(ctx, true));
  // teleBot.command("trend", (ctx) => trend(ctx));
  // teleBot.command("advertise", (ctx) => advertise(ctx));

  teleBot.on([":animation", ":video", ":media"], (ctx) => {
    const chatId = ctx.chat.id;
    if (userState[chatId] === "setgif") {
      // @ts-expect-error CTX type invalid
      setGifCommand(ctx);
    } else {
      // @ts-expect-error CTX type invalid
      executeStep(ctx);
    }
  });

  // @ts-expect-error CTX type invalid
  teleBot.on(["message"], (ctx) => executeStep(ctx));

  log("Bot commands up");
}
