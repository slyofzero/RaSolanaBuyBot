import { BotCallbackContextType, StoredGroup } from "@/types";
import { InlineKeyboard } from "grammy";
import { onlyAdmin } from "../utils";
import { getDocument, updateDocumentById } from "@/firebase";
import { log } from "@/utils/handlers";
import { syncProjectGroups } from "@/vars/projectGroups";

export async function removeGifCallback(ctx: BotCallbackContextType) {
  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  const callbackData = ctx.update.callback_query.data;
  if (callbackData.includes("confirm") && ctx.chat) {
    const { id: chatId } = ctx.chat;
    const group =
      ((
        await getDocument({
          collectionName: "project_groups",
          queries: [["chatId", "==", String(chatId)]],
        })
      ).at(0) as StoredGroup) || undefined;

    if (group && group.id) {
      let text = "";
      if (group.media) {
        await updateDocumentById({
          id: group.id,
          collectionName: "project_groups",
          updates: { gif: null },
        });

        log(`GIF reset back to null for ${chatId}`);
        syncProjectGroups();
        text = "Removed the custom GIF";
      } else {
        text = "You don't have a custom GIF set";
      }
      ctx.reply(text);
    }
  } else {
    const text = "Do you want to delete the custom GIF?";

    await ctx.editMessageText(text);
    await ctx.editMessageReplyMarkup({
      reply_markup: new InlineKeyboard()
        .text("Yes", "confirm-remove-gif")
        .text("No")
        .row()
        .text("Main menu", "settings-main-menu")
        .text("Set GIF", "set-gif"),
    });
  }
}
