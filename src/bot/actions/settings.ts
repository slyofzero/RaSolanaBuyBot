import { defaultEmoji, minBuy } from "@/utils/constants";
import { projectGroups } from "@/vars/projectGroups";
import { settingsState } from "@/vars/state";
import { CommandContext, Context, InlineKeyboard } from "grammy";

export async function settingsMenu(ctx: CommandContext<Context>) {
  const chatId = ctx.chat.id;
  const matchText = ctx.match as string;
  const text = "Choose from the following options to customize your buybot";
  const projectId = Number(matchText.split("_").at(-1));

  settingsState[chatId] = { projectId };

  const projectGroup = projectGroups.find(
    ({ chatId }) => chatId === String(projectId)
  );

  const keyboard = new InlineKeyboard()
    .text(`${projectGroup?.token ? "✅ " : ""}Token`, "inputTokenAddress")
    .text(`Min Buy ($${projectGroup?.minBuy || minBuy})`, "inputMinBuy")
    .row()
    .text(`Emoji (${projectGroup?.emoji || defaultEmoji})`, "inputEmoji")
    .text(`${projectGroup?.media ? "✅ " : ""}Media`, "inputMedia")
    .row()
    .text(`${projectGroup?.websiteLink ? "✅ " : ""}Website`, "inputWebsite")
    .text(`${projectGroup?.telegramLink ? "✅ " : ""}Telegram`, "inputTelegram")
    .text(`${projectGroup?.twitterLink ? "✅ " : ""}X`, "inputTwitter");

  ctx.reply(text, { reply_markup: keyboard });
}
