import { onlyAdmin } from "@/utils/bot";
import { BOT_USERNAME } from "@/utils/env";
import { CommandContext, Context, InlineKeyboard } from "grammy";

export async function settings(ctx: CommandContext<Context>) {
  const { type, id } = ctx.chat;

  if (type === "private") {
    const text = "Only works in groups or channels";
    ctx.reply(text);
    return false;
  }

  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  const text =
    "Customize your bot here. You can customize the message the bot would send to fit your project. Click below to continue in private chat.";
  const keyboard = new InlineKeyboard().url(
    "Continue in private chat",
    `https://t.me/${BOT_USERNAME}?start=settings_${id}`
  );

  ctx.reply(text, { reply_markup: keyboard });
}
