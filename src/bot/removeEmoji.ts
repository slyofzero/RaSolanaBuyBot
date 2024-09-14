import { StoredGroup } from "@/types";
import { CallbackQueryContext, Context, InlineKeyboard } from "grammy";
import { onlyAdmin } from "../utils/bot";
import { updateDocumentById } from "@/firebase";
import { log } from "@/utils/handlers";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";

export async function removeEmojiCallback(ctx: CallbackQueryContext<Context>) {
  const isAdmin = await onlyAdmin(ctx);
  const chatId = ctx.chat?.id;
  if (!isAdmin || !chatId) return false;

  const group = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(chatId)
  );

  if (group && !group.emoji) {
    return ctx.reply("You don't have any custom emoji set");
  }

  const text =
    "Do you want to delete the custom emoji? It will revert back to 🟢";

  const keyboard = new InlineKeyboard()
    .text("Yes", "userRemoveEmoji-yes")
    .text("No", "userRemoveEmoji-no");
  await ctx.deleteMessage();
  ctx.reply(text, { reply_markup: keyboard });
}

export async function removeEmoji(ctx: CallbackQueryContext<Context>) {
  const isAdmin = await onlyAdmin(ctx);
  const chatId = ctx.chat?.id;
  if (!isAdmin || !chatId) return false;

  const confirmDelete = ctx.callbackQuery.data.split("-").at(-1) === "yes";

  const group = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(chatId)
  );

  if (!group || !group.id) return ctx.reply("Please do /start");

  let text = "";
  if (confirmDelete) {
    if (group.emoji) {
      updateDocumentById<StoredGroup>({
        id: group.id,
        collectionName: "project_groups",
        updates: { emoji: null },
      }).then(() => syncProjectGroups());

      log(`Emoji reset back to 🟢 for ${chatId}`);
      text = "Emoji reset back to 🟢";
    } else {
      text = "You don't have a custom emoji set";
    }

    ctx.reply(text);
  }

  ctx.deleteMessage();
}
