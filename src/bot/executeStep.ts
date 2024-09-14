import { CallbackQueryContext, CommandContext, Context } from "grammy";
import { userState } from "@/vars/state";
import { log } from "@/utils/handlers";
import { removeEmoji, removeEmojiCallback } from "./removeEmoji";
import { removeMedia, removeMediaCallback } from "./removeMedia";
import { inputTokenAddress, setTokenAddress } from "./actions/setUp";
import { inputMinBuy, setMinBuy } from "./actions/setMinBuy";
import { inputEmoji, setEmoji } from "./actions/setEmoji";
import { inputWebsite, setWebsite } from "./actions/setWebsite";
import { inputTelegram, setTelegram } from "./actions/setTelegram";
import { inputTwitter, setTwitter } from "./actions/setTwitter";
import { inputMedia, setMedia } from "./actions/setMedia";

const steps: { [key: string]: any } = {
  removeEmoji: removeEmojiCallback,
  userRemoveEmoji: removeEmoji,

  removeMedia: removeMediaCallback,
  userRemoveMedia: removeMedia,

  inputTokenAddress,
  setTokenAddress,

  inputMedia,
  setMedia,

  inputMinBuy,
  setMinBuy,

  inputEmoji,
  setEmoji,

  inputWebsite,
  setWebsite,

  inputTelegram,
  setTelegram,

  inputTwitter,
  setTwitter,
};

export async function executeStep(
  ctx: CommandContext<Context> | CallbackQueryContext<Context>
) {
  const chatId = ctx.chat?.id;
  if (!chatId) return ctx.reply("Please redo your action");

  const queryCategory = ctx.callbackQuery?.data?.split("-").at(0);
  const step = userState[chatId] || queryCategory || "";
  const stepFunction = steps[step];

  if (stepFunction) {
    stepFunction(ctx);
  } else {
    log(`No step function for ${queryCategory} ${userState[chatId]}`);
  }
}
