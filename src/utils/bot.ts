import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { Context } from "grammy";
import { errorHandler, log } from "./handlers";
import { removeDocumentById } from "@/firebase";

// eslint-disable-next-line
export function cleanUpBotMessage(text: any) {
  text = String(text);
  text = text
    .replace(/\./g, "\\.")
    .replace(/-/g, "\\-")
    .replace(/!/g, "\\!")
    .replace(/#/g, "\\#");

  return text;
}

// eslint-disable-next-line
export function hardCleanUpBotMessage(text: any) {
  text = String(text);
  text = text
    .replace(/\./g, "\\.")
    .replace(/-/g, "\\-")
    .replace(/_/g, "\\_")
    .replace(/\|/g, "\\|")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/`/g, "\\`")
    .replace(/\+/g, "\\+")
    .replace(/!/g, "\\!")
    .replace(/#/g, "\\#")
    .replace(/\*/g, "\\*");

  return text;
}

export function botRemovedError(e: any, chatId: string) {
  const err = e as Error;

  if (
    err.message.includes("chat not found") ||
    err.message.includes("kicked") ||
    err.message.includes("chat was upgraded") ||
    err.message.includes("not enough rights") ||
    err.message.includes("is not a member")
  ) {
    const projectGroup = projectGroups.find(
      ({ chatId: storedChatId }) => storedChatId === String(chatId)
    );
    removeDocumentById({
      collectionName: "project_groups",
      id: projectGroup?.id || "",
    }).then(() => syncProjectGroups());
  } else {
    log(err.message);
  }
  errorHandler(e);
}

export async function onlyAdmin(ctx: Context) {
  if (!ctx.chat) {
    return;
  }
  // Channels and private chats are only postable by admins
  if (["channel", "private"].includes(ctx.chat.type)) {
    return true;
  }
  // Anonymous users are always admins
  if (ctx.from?.username === "GroupAnonymousBot") {
    return true;
  }
  // Surely not an admin
  if (!ctx.from?.id) {
    return;
  }
  // Check the member status
  const chatMember = await ctx.getChatMember(ctx.from.id);
  if (["creator", "administrator"].includes(chatMember.status)) {
    return true;
  }
  // Not an admin
  return false;
}
