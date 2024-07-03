import { errorHandler, log } from "@/utils/handlers";
import { CallbackQueryContext, CommandContext, Context } from "grammy";
import { onlyAdmin } from "../utils";
import { getUserGroups } from "@/utils/bot";
import { userState } from "@/vars/state";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { StoredGroup } from "@/types";
import { updateDocumentById } from "@/firebase";
import { setMediaState } from "@/vars/settingsState";
import { BOT_USERNAME } from "@/utils/env";

export async function setMediaCommand(ctx: CommandContext<Context>) {
  try {
    const { id: chatId, type } = ctx.chat;

    if (type === "private") {
      const userGroups = await getUserGroups(chatId, "setMedia");
      const text = "Select the group you want to set the gif/photo for.";
      return ctx.reply(text, { reply_markup: userGroups });
    }

    const isAdmin = await onlyAdmin(ctx);
    if (!isAdmin) return false;
    return ctx.reply(
      `Please go to @${BOT_USERNAME} and do /setmedia in the bot messages.`
    );

    // const { id: chatId, type } = ctx.chat;
    // const { message, channel_post } = ctx.update;
    // const { animation, video } = message || channel_post;
    // const videoSource = animation || video;

    // let text = "";
    // if (type === "private") {
    //   text = "Only works in groups or channels";
    //   ctx.reply(text);
    //   return false;
    // }

    // const isAdmin = await onlyAdmin(ctx);
    // if (!isAdmin) return false;

    // const group = (
    //   await getDocument<StoredGroup>({
    //     collectionName: "project_groups",
    //     queries: [["chatId", "==", String(chatId)]],
    //   })
    // ).at(0);

    // if (!(group && group.id)) {
    //   text = `Please do /start and set a token first for your ${type}, only then do /setmedia.`;
    //   return ctx.reply(text);
    // }

    // const userStateValue = userState[chatId];

    // if (userStateValue === "setMedia") {
    //   if (videoSource) {
    //     const { file_id: gif, mime_type } = videoSource;
    //     const isValidMimeType =
    //       mime_type?.includes("video") || mime_type?.includes("gif");

    //     if (isValidMimeType) {
    //       await updateDocumentById({
    //         id: group.id,
    //         collectionName: "project_groups",
    //         updates: { gif: gif },
    //       });
    //       log(`Set GIF added ${gif} for ${chatId}`);
    //       syncProjectGroups();
    //       text = `New GIF set`;
    //     } else {
    //       text = "Invalid GIF, try some other one";
    //     }
    //   } else {
    //     text = "Please do /setmedia again";
    //   }

    //   delete userState[chatId];
    //   ctx.reply(text);
    // } else if (commandCall) {
    //   userState[chatId] = "setMedia";
    //   text = "Send a GIF in the next message to set it as the custom GIF.";
    //   ctx.reply(text);
    // }
  } catch (error) {
    errorHandler(error);
  }
}

export async function setMedia(ctx: CallbackQueryContext<Context>) {
  const chatId = ctx.from.id;
  const callbackQueryData = ctx.callbackQuery.data;
  const firstDashIndex = callbackQueryData.indexOf("-");
  const projectChatId = callbackQueryData.substring(firstDashIndex + 1);

  ctx.deleteMessage();

  setMediaState[chatId] = { projectChatId };
  userState[chatId] = "setMediaFinal";

  return ctx.reply("Please send the gif/photo you want to set.");
}

export async function setMediaFinal(ctx: CommandContext<Context>) {
  const chatId = ctx.chat.id;
  const { message, channel_post } = ctx.update;
  const { animation, video, photo } = message || channel_post;
  const videoSource = animation || video || photo?.at(-1);

  const { projectChatId } = setMediaState[chatId];
  const projectGroup = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(projectChatId)
  );
  const mediaType: "gif" | "photo" = photo?.at(-1) ? "photo" : "gif";

  let text = "";
  if (videoSource) {
    const { file_id: media } = videoSource;

    await updateDocumentById<StoredGroup>({
      id: projectGroup?.id || "",
      updates: { media, mediaType },
      collectionName: "project_groups",
    });
    syncProjectGroups();
    log(`Set media ${media} for ${chatId}`);

    text = "Media set.";
  } else {
    text = "Invalid media type, try some other one";
  }

  delete userState[chatId];
  ctx.reply(text);
}
