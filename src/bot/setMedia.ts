import { updateDocumentById } from "@/firebase";
import { StoredGroup } from "@/types";
import { onlyAdmin } from "@/utils/bot";
import { errorHandler, log } from "@/utils/handlers";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { userState } from "@/vars/state";
import { CommandContext, Context, HearsContext } from "grammy";

export async function setMediaCallback(ctx: HearsContext<Context>) {
  const { id: chatId, type } = ctx.chat;
  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  let text = "";
  if (type === "private") {
    text = "Only works in groups or channels";
    ctx.reply(text);
    return false;
  }

  const group = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(chatId)
  );
  if (!group) {
    return ctx.reply(
      "Please start the buybot first using /start, and then set the GIF or photo."
    );
  }

  userState[chatId] = "userSetMedia";

  if (type !== "channel")
    text = "Reply to this message with the GIF or photo you want to set.";
  else
    text =
      "Send a GIF or photo in the next message to set it as the custom media.";

  await ctx.deleteMessage();
  ctx.reply(text);
}

export async function setMedia(ctx: CommandContext<Context>) {
  const { id: chatId } = ctx.chat;
  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  const { message, channel_post } = ctx.update;
  const { animation, video, photo } = message || channel_post;
  const mediaSource = animation || video || photo?.at(-1);

  let mediaType: StoredGroup["mediaType"] = "video";
  if (photo?.at(-1)) mediaType = "photo";

  let text = "";
  if (!mediaSource) {
    return ctx.reply("Invalid GIF or photo, try some other one");
  }

  const { file_id } = mediaSource;
  const group = projectGroups.find(
    ({ chatId: storedChatId }) => storedChatId === String(chatId)
  );

  if (group && group.id) {
    updateDocumentById<StoredGroup>({
      collectionName: "project_groups",
      id: group.id,
      updates: { media: file_id, mediaType },
    }).then(() => syncProjectGroups());

    log(`Set media added ${file_id} for ${chatId}`);
    text = `New ${mediaType} set`;

    delete userState[chatId];
  }

  ctx.reply(text).catch((e) => errorHandler(e));
}
