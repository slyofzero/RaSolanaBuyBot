import { updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { settingsState, userState } from "@/vars/state";
import { CallbackQueryContext, CommandContext, Context } from "grammy";

export async function inputMinBuy(ctx: CallbackQueryContext<Context>) {
  const chatId = ctx.chat?.id || ctx.from?.id;

  if (!chatId) return ctx.reply("Please restart the command again.");
  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup)
    return ctx.reply(
      "Couldn't find the project group ID, please do /settings again."
    );

  const text = "❔ Send me the minimum value of a buy.";
  userState[chatId] = "setMinBuy";
  ctx.reply(text);
}

export async function setMinBuy(ctx: CommandContext<Context>) {
  const chatId = ctx.chat.id;
  const minBuy = Number(ctx.message?.text);

  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup) return ctx.reply("Please restart the command again.");
  if (isNaN(minBuy)) return ctx.reply("Please enter a proper numerical value.");

  delete userState[chatId];

  const projectGroupData = projectGroups.find(
    ({ chatId }) => chatId === String(projectGroup)
  );

  if (projectGroupData) {
    updateDocumentById<StoredGroup>({
      id: projectGroupData.id || "",
      collectionName: "project_groups",
      updates: { minBuy },
    }).then(() => syncProjectGroups());
  } else {
    return ctx.reply(
      "Couldn't find the project group ID, please do /setup to set the buybot up."
    );
  }

  ctx.reply(`✅ ${minBuy} set as the minimum buy for the group.`);
}
