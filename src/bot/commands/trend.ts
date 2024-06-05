import { apiFetcher } from "@/utils/api";
import { trendPrices } from "@/utils/constants";
import { isValidSolAddress } from "@/utils/web3";
import { trendingState, userState } from "@/vars/state";
import { toTrendTokens } from "@/vars/toTrend";
import {
  CallbackQueryContext,
  CommandContext,
  Context,
  InlineKeyboard,
} from "grammy";
import { preparePayment } from "../payment";
import { isValidUrl } from "@/utils/general";
import { TokenPoolData } from "@/types/terminalData";
import { PairsData } from "@/types/pairData";
import { TOKEN_DATA_URL } from "@/utils/env";
import { errorHandler } from "@/utils/handlers";
import { CallbackQuery } from "grammy/types";

export async function trend(ctx: CommandContext<Context>) {
  try {
    const { id: chatId, type } = ctx.chat;

    if (type !== "private") return;

    userState[chatId] = "toTrend";
    const text = `To trend a token, please provide the token's address in the next message`;
    await ctx.reply(text);
  } catch (error) {
    errorHandler(error);
  }
}

export async function addTrendingSocial(ctx: CommandContext<Context>) {
  try {
    const { id: chatId } = ctx.chat;
    const token = ctx.message?.text;

    if (!isValidSolAddress(token || "")) {
      return await ctx.reply("Please enter a proper token address");
    }

    const terminalResponse = apiFetcher<TokenPoolData>(
      `https://api.geckoterminal.com/api/v2/search/pools?query=${token}&network=ton&page=1`
    );
    const dexSResonse = apiFetcher<PairsData>(`${TOKEN_DATA_URL}/${token}`);

    const [terminalData, dexSData] = await Promise.all([
      terminalResponse,
      dexSResonse,
    ]);

    if (
      terminalData.data.data?.length === 0 &&
      dexSData.data.pairs?.length === 0
    ) {
      return await ctx.reply("The address you entered has no pairs on Ton");
    }

    const storedTokenData = toTrendTokens.find(
      ({ token: storedToken }) => storedToken === token
    );
    if (storedTokenData) {
      return await ctx.reply(`Token ${token} is already trending`);
    }

    trendingState[chatId] = { token };

    userState[chatId] = "trendSocials";
    const text = `Please pass a social link related to the token in the next message`;
    await ctx.reply(text);
  } catch (error) {
    errorHandler(error);
  }
}

export async function setTrendingEmoji(ctx: CommandContext<Context>) {
  try {
    const { id: chatId } = ctx.chat;
    const link = ctx.message?.text || "";

    if (!isValidUrl(link)) {
      return await ctx.reply("Please enter a valid URL");
    }

    trendingState[chatId] = { ...trendingState[chatId], social: link };
    delete userState[chatId];

    const keyboard = new InlineKeyboard().text("Keep default", "defaultEmoji");

    await ctx.reply(
      "Send an emoji in the next message, this emoji will be shown in the buybot messages in the trending channel.",
      { reply_markup: keyboard }
    );
    userState[chatId] = "trendEmoji";
  } catch (error) {
    errorHandler(error);
  }
}

export async function setTrendingGif(ctx: CommandContext<Context>) {
  try {
    const { id: chatId } = ctx.chat;
    const callbackQuery = ctx.callbackQuery as unknown as
      | CallbackQuery
      | undefined;
    const emoji = callbackQuery?.data ? "" : ctx.message?.text || "";

    if (callbackQuery?.data) ctx.deleteMessage();

    trendingState[chatId] = { ...trendingState[chatId], emoji };
    delete userState[chatId];

    const keyboard = new InlineKeyboard().text("Keep default", "defaultGif");

    await ctx.reply(
      "Send a GIF in the next message, this GIF will be shown in the buybot messages in the trending channel.",
      { reply_markup: keyboard }
    );
    userState[chatId] = "trendGif";
  } catch (error) {
    errorHandler(error);
  }
}

export async function selectTrendingDuration(ctx: CommandContext<Context>) {
  try {
    const { id: chatId } = ctx.chat;
    const callbackQuery = ctx.callbackQuery as unknown as
      | CallbackQuery
      | undefined;
    const emoji = callbackQuery?.data ? "" : ctx.message?.text || "";

    if (callbackQuery?.data) ctx.deleteMessage();

    trendingState[chatId] = { ...trendingState[chatId], emoji };
    delete userState[chatId];

    // let gif = "";

    // const callbackQuery = ctx.callbackQuery as unknown as
    //   | CallbackQuery
    //   | undefined;

    // if (!callbackQuery?.data) {
    //   const { message, channel_post } = ctx.update;
    //   const { animation, video } = message || channel_post;
    //   const videoSource = animation || video;

    //   if (!videoSource)
    //     return await ctx.reply("Please send a valid GIF or video");

    //   const { file_id, mime_type } = videoSource;
    //   gif = file_id;
    //   const isValidMimeType =
    //     mime_type?.includes("video") || mime_type?.includes("gif");
    //   if (!isValidMimeType)
    //     return await ctx.reply("Please send a valid GIF or video");
    // } else {
    //   ctx.deleteMessage();
    // }

    // trendingState[chatId] = { ...trendingState[chatId], gif };
    // delete userState[chatId];

    const text = "Select the duration you want your token to trend for.";
    let keyboard = new InlineKeyboard();

    const tiersFilled = { 1: 0, 2: 0, 3: 0 };
    for (const token of toTrendTokens) {
      tiersFilled[token.slot] += 1;
    }

    if (tiersFilled[1] !== 3) {
      keyboard = keyboard.text("⬇️ Top 3 ⬇️");
      for (const [duration, price] of Object.entries(trendPrices[1])) {
        const slotText = `${duration} hours - ${price} SOL`;
        keyboard = keyboard.text(slotText, `trendDuration-1-${duration}`);
      }
    }

    if (tiersFilled[2] !== 7) {
      keyboard = keyboard.row().text("⬇️ 3 - 10 ⬇️");
      for (const [duration, price] of Object.entries(trendPrices[2])) {
        const slotText = `${duration} hours - ${price} SOL`;
        keyboard = keyboard.text(slotText, `trendDuration-2-${duration}`);
      }
    }

    keyboard = keyboard.toTransposed();
    keyboard = keyboard.row().text("⬇️ 11 - 20 ⬇️").row();

    if (tiersFilled[3] !== 10) {
      for (const [duration, price] of Object.entries(trendPrices[3])) {
        const slotText = `${duration} hours - ${price} SOL`;
        keyboard = keyboard.text(slotText, `trendDuration-3-${duration}`).row();
      }
    }

    await ctx.reply(text, { reply_markup: keyboard });
  } catch (error) {
    errorHandler(error, true);
  }
}

export function prepareTrendingState(ctx: CallbackQueryContext<Context>) {
  // @ts-expect-error temp
  const chatId = ctx.chat?.id || "";
  const [slot, duration] = ctx.callbackQuery.data
    .replace("trendDuration-", "")
    .split("-")
    .map((item) => Number(item));

  trendingState[chatId] = { ...trendingState[chatId], slot, duration };
  preparePayment(ctx);
}
