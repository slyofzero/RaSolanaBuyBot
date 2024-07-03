import { BotCallbackContextType } from "@/types";
import { InlineKeyboard } from "grammy";
import { onlyAdmin } from "../utils";

export async function setGifCallback(ctx: BotCallbackContextType) {
  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  const text =
    "A GIF can be sent every few interval with a buy message. To set a gif simply type /setmedia in the chat.";

  await ctx.editMessageText(text);
  await ctx.editMessageReplyMarkup({
    reply_markup: new InlineKeyboard()
      .text("Main menu", "settings-main-menu")
      .text("Remove gif", "remove-gif"),
  });
}
