import { updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { log } from "@/utils/handlers";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { settingsState, userState } from "@/vars/state";
import { CallbackQueryContext, CommandContext, Context } from "grammy";

export async function inputMedia(ctx: CallbackQueryContext<Context>) {
  const chatId = ctx.chat?.id || ctx.from?.id;

  if (!chatId) return ctx.reply("Please restart the command again.");
  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup)
    return ctx.reply(
      "Couldn't find the project group ID, please do /settings again."
    );

  const text = "❔ Send me the photo/gif/video.";
  userState[chatId] = "setMedia";
  ctx.reply(text);
}

export async function setMedia(ctx: CommandContext<Context>) {
  const { id: chatId } = ctx.chat;

  const { message, channel_post } = ctx.update;
  const { animation, video, photo } = message || channel_post;
  const mediaSource = animation || video || photo?.at(-1);

  const projectGroup = settingsState[chatId]?.projectId;

  if (!projectGroup) return ctx.reply("Please restart the command again.");

  let mediaType: StoredGroup["mediaType"] = "video";
  if (photo?.at(-1)) mediaType = "photo";

  if (!mediaSource) {
    return ctx.reply("Invalid GIF or photo, try some other one");
  }

  const { file_id } = mediaSource;
  const projectGroupData = projectGroups.find(
    ({ chatId }) => chatId === String(projectGroup)
  );

  if (projectGroupData && projectGroupData.id) {
    updateDocumentById<StoredGroup>({
      collectionName: "project_groups",
      id: projectGroupData.id,
      updates: { media: file_id, mediaType },
    }).then(() => syncProjectGroups());

    log(`Set media added ${file_id} for ${chatId}`);

    delete userState[chatId];

    ctx.reply(`✅ Sent ${mediaType} set as the media for the group.`);
  }
}
