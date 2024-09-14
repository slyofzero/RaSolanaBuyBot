import { updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { onlyAdmin } from "@/utils/bot";
import { log } from "@/utils/handlers";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { CallbackQueryContext, Context, InlineKeyboard } from "grammy";

export async function removeMediaCallback(ctx: CallbackQueryContext<Context>) {
  const isAdmin = await onlyAdmin(ctx);
  const chatId = ctx.chat?.id;
  if (!isAdmin || !chatId) return false;

  const group = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(chatId)
  );

  if (group && !group.media) {
    return ctx.reply("You don't have any custom media set");
  }

  const text = "Do you want to delete the custom media?";

  const keyboard = new InlineKeyboard()
    .text("Yes", "userRemoveMedia-yes")
    .text("No", "userRemoveMedia-no");
  await ctx.deleteMessage();
  ctx.reply(text, { reply_markup: keyboard });
}

export async function removeMedia(ctx: CallbackQueryContext<Context>) {
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
        updates: { media: null, mediaType: null },
      }).then(() => syncProjectGroups());

      log(`Media reset back to null for ${chatId}`);
      text = "Removed the custom media";
    } else {
      text = "You don't have a custom media set";
    }

    ctx.reply(text);
  }

  ctx.deleteMessage();
}
