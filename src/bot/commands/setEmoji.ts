import { BotCommandContextType, StoredGroup } from "@/types";
import { errorHandler, log } from "@/utils/handlers";
import { getUserGroups } from "@/utils/bot";
import { onlyAdmin } from "../utils";
import { CallbackQueryContext, CommandContext, Context } from "grammy";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { setEmojiState } from "@/vars/settingsState";
import { userState } from "@/vars/state";
import { updateDocumentById } from "@/firebase";
import { BOT_USERNAME } from "@/utils/env";

export async function setEmojiCommand(ctx: BotCommandContextType) {
  try {
    const { id: chatId, type } = ctx.chat;

    if (type === "private") {
      const userGroups = await getUserGroups(chatId, "setEmoji");
      const text = "Select the group you want to set the emoji for.";
      return ctx.reply(text, { reply_markup: userGroups });
    }

    const isAdmin = await onlyAdmin(ctx);
    if (!isAdmin) return false;
    return ctx.reply(
      `Please go to @${BOT_USERNAME} and do /setemoji in the bot messages.`
    );

    // const isAdmin = await onlyAdmin(ctx);
    // if (!isAdmin) return false;

    // const group = (
    //   await getDocument<StoredGroup>({
    //     collectionName: "project_groups",
    //     queries: [["chatId", "==", String(chatId)]],
    //   })
    // ).at(0);

    // if (!(group && group.id)) {
    //   text = `Please do /start and set a token first for your ${type}, only then do /setMedia.`;
    //   return ctx.reply(text);
    // }

    // if (!emoji) {
    //   text = "Missing emoji. To set it do - /setemoji <emoji>";
    // } else {
    //   await updateDocumentById({
    //     id: group.id,
    //     collectionName: "project_groups",
    //     updates: { emoji: emoji },
    //   });

    //   log(`Set emoji ${emoji} for ${chatId}`);
    //   syncProjectGroups();
    //   text = `New emoji ${emoji} set`;
    // }

    // ctx.reply(text);
  } catch (error) {
    errorHandler(error);
  }
}

export async function setEmoji(ctx: CallbackQueryContext<Context>) {
  const chatId = ctx.from.id;
  const callbackQueryData = ctx.callbackQuery.data;
  const firstDashIndex = callbackQueryData.indexOf("-");
  const projectChatId = callbackQueryData.substring(firstDashIndex + 1);

  ctx.deleteMessage();

  setEmojiState[chatId] = { projectChatId };
  userState[chatId] = "setEmojiFinal";

  return ctx.reply("Please send the emoji you want to set.");
}

export async function setEmojiFinal(ctx: CommandContext<Context>) {
  const chatId = ctx.chat.id;
  const emoji = ctx.message?.text;
  const { projectChatId } = setEmojiState[chatId];

  const projectGroup = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(projectChatId)
  );

  await updateDocumentById<StoredGroup>({
    id: projectGroup?.id || "",
    updates: { emoji },
    collectionName: "project_groups",
  });

  syncProjectGroups();

  log(`Set emoji ${emoji} for ${chatId}`);

  return ctx.reply("Emoji set.");
}
