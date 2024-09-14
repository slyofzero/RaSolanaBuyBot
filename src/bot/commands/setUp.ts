import { BOT_USERNAME } from "@/utils/env";
import { CommandContext, Context, Keyboard } from "grammy";

export async function setUpBot(ctx: CommandContext<Context>) {
  const { type } = ctx.chat;

  if (type !== "private") {
    const text = `Only works in private chats, do /setup at @${BOT_USERNAME}`;
    ctx.reply(text);
    return false;
  }

  const text = "❔ Select the group to add the buybot in.";
  const keyboard = new Keyboard()
    .requestChat(text, 7, {
      chat_is_channel: false,
      user_administrator_rights: {
        is_anonymous: false,
        can_manage_chat: true,
        can_delete_messages: true,
        can_manage_video_chats: false,
        can_restrict_members: true,
        can_promote_members: true,
        can_change_info: true,
        can_invite_users: true,
        can_post_stories: false,
        can_edit_stories: false,
        can_delete_stories: false,
        can_pin_messages: true,
        can_post_messages: true,
      },
      bot_administrator_rights: {
        can_manage_chat: true,
        can_post_messages: true,
        is_anonymous: false,
        can_delete_messages: true,
        can_manage_video_chats: false,
        can_restrict_members: true,
        can_promote_members: true,
        can_change_info: true,
        can_invite_users: true,
        can_post_stories: false,
        can_edit_stories: false,
        can_delete_stories: false,
      },
    })
    .resized()
    .oneTime();

  ctx.reply(text, { reply_markup: keyboard });
}
