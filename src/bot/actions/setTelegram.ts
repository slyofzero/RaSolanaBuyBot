import { updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { isValidInviteLink } from "@/utils/general";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { settingsState, userState } from "@/vars/state";
import { CallbackQueryContext, CommandContext, Context } from "grammy";

export async function inputTelegram(ctx: CallbackQueryContext<Context>) {
  const chatId = ctx.chat?.id || ctx.from?.id;

  if (!chatId) return ctx.reply("Please restart the command again.");
  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup)
    return ctx.reply(
      "Couldn't find the project group ID, please do /settings again."
    );

  const text = "❔ Send me the telegram link.";
  userState[chatId] = "setTelegram";
  ctx.reply(text);
}

export async function setTelegram(ctx: CommandContext<Context>) {
  const chatId = ctx.chat.id;
  const telegramLink = ctx.message?.text || "";

  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup) return ctx.reply("Please restart the command again.");
  if (!isValidInviteLink(telegramLink))
    return ctx.reply("Please send a valid telegram link.");

  delete userState[chatId];

  const projectGroupData = projectGroups.find(
    ({ chatId }) => chatId === String(projectGroup)
  );

  if (projectGroupData) {
    updateDocumentById<StoredGroup>({
      id: projectGroupData.id || "",
      collectionName: "project_groups",
      updates: { telegramLink },
    }).then(() => syncProjectGroups());
  } else {
    return ctx.reply(
      "Couldn't find the project group ID, please do /setup to set the buybot up."
    );
  }

  ctx.reply(`✅ ${telegramLink} set as the telegram link for the group.`);
}
