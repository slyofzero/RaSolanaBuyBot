import { updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { isValidTwitterLink } from "@/utils/general";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { settingsState, userState } from "@/vars/state";
import { CallbackQueryContext, CommandContext, Context } from "grammy";

export async function inputTwitter(ctx: CallbackQueryContext<Context>) {
  const chatId = ctx.chat?.id || ctx.from?.id;

  if (!chatId) return ctx.reply("Please restart the command again.");
  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup)
    return ctx.reply(
      "Couldn't find the project group ID, please do /settings again."
    );

  const text = "❔ Send me the X profile link.";
  userState[chatId] = "setTwitter";
  ctx.reply(text);
}

export async function setTwitter(ctx: CommandContext<Context>) {
  const chatId = ctx.chat.id;
  const twitterLink = ctx.message?.text || "";

  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup) return ctx.reply("Please restart the command again.");
  if (!isValidTwitterLink(twitterLink))
    return ctx.reply("Please send a valid X link.");

  delete userState[chatId];

  const projectGroupData = projectGroups.find(
    ({ chatId }) => chatId === String(projectGroup)
  );

  if (projectGroupData) {
    updateDocumentById<StoredGroup>({
      id: projectGroupData.id || "",
      collectionName: "project_groups",
      updates: { twitterLink },
    }).then(() => syncProjectGroups());
  } else {
    return ctx.reply(
      "Couldn't find the project group ID, please do /setup to set the buybot up."
    );
  }

  ctx.reply(`✅ ${twitterLink} set as the X link for the group.`);
}
