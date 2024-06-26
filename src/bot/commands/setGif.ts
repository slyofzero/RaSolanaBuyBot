import { getDocument, updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { errorHandler, log } from "@/utils/handlers";
import { Context, HearsContext } from "grammy";
import { userState } from "@/vars/state";
import { onlyAdmin } from "../utils";
import { syncProjectGroups } from "@/vars/projectGroups";

export async function setGifCommand(
  ctx: HearsContext<Context>,
  commandCall?: boolean
) {
  try {
    const { id: chatId, type } = ctx.chat;
    const { message, channel_post } = ctx.update;
    const { animation, video } = message || channel_post;
    const videoSource = animation || video;

    let text = "";
    if (type === "private") {
      text = "Only works in groups or channels";
      ctx.reply(text);
      return false;
    }

    const isAdmin = await onlyAdmin(ctx);
    if (!isAdmin) return false;

    const userStateValue = userState[chatId];

    if (userStateValue === "setgif") {
      if (videoSource) {
        const { file_id: gif, mime_type } = videoSource;
        const isValidMimeType =
          mime_type?.includes("video") || mime_type?.includes("gif");

        if (isValidMimeType) {
          const groups =
            ((await getDocument({
              collectionName: "project_groups",
              queries: [["chatId", "==", String(chatId)]],
            })) as StoredGroup[]) || undefined;

          for (const group of groups) {
            if (group && group.id) {
              await updateDocumentById({
                id: group.id,
                collectionName: "project_groups",
                updates: { gif: gif },
              });
              log(`Set GIF added ${gif} for ${chatId}`);
              syncProjectGroups();
              text = `New GIF set`;
            }
          }
        } else {
          text = "Invalid GIF, try some other one";
        }
      } else {
        text = "Invalid GIF, try some other one";
      }

      delete userState[chatId];
      ctx.reply(text);
    } else if (commandCall) {
      userState[chatId] = "setgif";
      text = "Send a GIF in the next message to set it as the custom GIF.";
      ctx.reply(text);
    }
  } catch (error) {
    errorHandler(error);
  }
}
