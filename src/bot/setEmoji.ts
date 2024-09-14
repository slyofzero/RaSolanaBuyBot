import { updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { onlyAdmin } from "@/utils/bot";
import { log } from "@/utils/handlers";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { userState } from "@/vars/state";
import { CallbackQueryContext, CommandContext, Context } from "grammy";

export async function setEmojiCallBack(ctx: CallbackQueryContext<Context>) {
  const isAdmin = await onlyAdmin(ctx);
  const chatId = ctx.chat?.id;
  if (!isAdmin || !chatId) return false;

  const text =
    "The green circle emoji 🟢 in the messages would be replaced with your custom one. To set an emoji pass it in the next message.";

  userState[chatId] = "userSetEmoji";

  ctx.deleteMessage();
  ctx.reply(text);
}

export async function setEmoji(ctx: CommandContext<Context>) {
  const { id: chatId, type } = ctx.chat;
  const emoji = ctx.message?.text || ctx.channelPost?.text;

  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  if (!emoji) {
    return ctx.reply("Please send an emoji in the next message");
  }

  const group = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(chatId)
  );

  if (!group || !group.id) {
    return ctx.reply(
      `Please first do /start and set a token to get alerts in this ${type}`
    );
  }

  delete userState[chatId];
  updateDocumentById<StoredGroup>({
    id: group.id,
    collectionName: "project_groups",
    updates: { emoji },
  }).then(() => {
    log(`Set emoji ${emoji} for ${chatId}`);
    syncProjectGroups();
  });

  ctx.reply(`New emoji ${emoji} set`);
}
