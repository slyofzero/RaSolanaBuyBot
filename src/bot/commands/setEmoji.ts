import { getDocument, updateDocumentById } from "@/firebase";
import { BotCommandContextType, StoredGroup } from "@/types";
import { errorHandler, log } from "@/utils/handlers";
import { onlyAdmin } from "../utils";
import { syncProjectGroups } from "@/vars/projectGroups";

export async function setEmojiCommand(ctx: BotCommandContextType) {
  try {
    const { match: emoji } = ctx;
    const { id: chatId, type } = ctx.chat;

    let text = "";
    if (type === "private") {
      text = "Only works in groups or channels";
      ctx.reply(text);
      return false;
    }

    const isAdmin = await onlyAdmin(ctx);
    if (!isAdmin) return false;

    const group = (
      await getDocument<StoredGroup>({
        collectionName: "project_groups",
        queries: [["chatId", "==", String(chatId)]],
      })
    ).at(0);

    if (!(group && group.id)) {
      text = `Please do /start and set a token first for your ${type}, only then do /setgif.`;
      return ctx.reply(text);
    }

    if (!emoji) {
      text = "Missing emoji. To set it do - /setemoji <emoji>";
    } else {
      await updateDocumentById({
        id: group.id,
        collectionName: "project_groups",
        updates: { emoji: emoji },
      });

      log(`Set emoji ${emoji} for ${chatId}`);
      syncProjectGroups();
      text = `New emoji ${emoji} set`;
    }

    ctx.reply(text);
  } catch (error) {
    errorHandler(error);
  }
}
