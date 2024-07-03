import { BotCommandContextType } from "@/types";
import { onlyAdmin } from "../utils";
import { BOT_USERNAME } from "@/utils/env";

export async function settings(ctx: BotCommandContextType) {
  const { type } = ctx.chat;

  let text = "";
  if (type === "private") {
    text = `Once you have started the buybot to any of your channels/group, you will be able to set emojis and gifs for the buys in this bot chat.
    
/setmedia - To set gif
/setemoji - To set emoji`;
    ctx.reply(text);
    return false;
  }

  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  text = `Please go to @${BOT_USERNAME} and do /settings in the bot messages.`;

  ctx.reply(text);
}
