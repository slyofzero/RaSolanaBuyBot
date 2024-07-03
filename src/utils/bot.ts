import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { InlineKeyboard } from "grammy";
import { teleBot } from "..";
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

export async function getUserGroups(chatId: number, purpose: string) {
  const userProjectGroups = projectGroups.filter(({ admins }) =>
    admins.includes(chatId)
  );

  let keyboard = new InlineKeyboard();

  if (userProjectGroups.length > 0) {
    for (const projectGroup of userProjectGroups) {
      const { chatId: projectChatId } = projectGroup;
      try {
        const projectData = await teleBot.api.getChat(projectChatId);
        // @ts-expect-error weird stuff
        const projectName = projectData.title;

        keyboard = keyboard.text(projectName, `${purpose}-${projectChatId}`);
      } catch (error) {
        errorHandler(error);
      }
    }
  }

  return keyboard;
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
      ({ chatId: storedChatId }) => storedChatId === chatId
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
