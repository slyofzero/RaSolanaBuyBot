import { errorHandler, log } from "@/utils/handlers";
import { memoTokenData } from "@/vars/tokens";
import { teleBot } from "..";
import { projectGroups } from "@/vars/projectGroups";
import {
  botRemovedError,
  cleanUpBotMessage,
  hardCleanUpBotMessage,
} from "@/utils/bot";
import { trendingTokens } from "@/vars/trending";
import { TRENDING_CHANNEL } from "@/utils/env";

export interface BuyData {
  buyer: string;
  amount: number;
  token: string;
  change: number;
  signature: string;
}

export async function sendAlert(data: BuyData) {
  try {
    const { buyer, amount, token, signature, change } = data;
    const groups = projectGroups.filter(
      ({ token: groupToken }) => groupToken === token
    );
    // console.log(isTrending, groups.length);
    if (!groups.length) return;

    // Preparing message for token
    const tokenData = memoTokenData[token];
    const { symbol } = tokenData.baseToken;
    const { priceNative, priceUsd, fdv, info } = tokenData;
    const sentUsdNumber = amount * Number(priceUsd);
    if (sentUsdNumber < 1) return;
    const sentNative = cleanUpBotMessage((amount * Number(priceNative)).toFixed(2)); // prettier-ignore
    const sentUsd = cleanUpBotMessage(sentUsdNumber.toFixed(2));
    const formattedAmount = cleanUpBotMessage(amount.toLocaleString("en"));
    const position = change ? `+${change}%` : "New!!!";

    log(`${buyer} bought ${amount} ${symbol}`);

    const randomizeEmojiCount = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    let emojiCount = 0;
    if (sentUsdNumber <= 50) {
      emojiCount = randomizeEmojiCount(5, 10);
    } else if (sentUsdNumber <= 100) {
      emojiCount = randomizeEmojiCount(10, 35);
    } else {
      emojiCount = randomizeEmojiCount(35, 70);
    }

    // links
    const buyerLink = `https://solscan.io/account/${buyer}`;
    const txnLink = `https://solscan.io/tx/${signature}`;
    const dexSLink = `https://dexscreener.com/solana/7fdjh3zyup8ri6j8nglcpcxqsak8d9vbpab7pvibg4d1/${token}`;
    const trendingLink = `https://t.me/c/2125443386/2`;
    const photonLink = `https://photon-sol.tinyastro.io/en/lp/${token}`;
    const trendingRank = Object.entries(trendingTokens).findIndex(
      ([trendingToken]) => trendingToken === token
    );

    const telegramLink = info?.socials?.find(
      ({ type }) => type.toLowerCase() === "telegram"
    )?.url;

    const specialLink = telegramLink
      ? `[Telegram](${telegramLink})`
      : `[Screener](${dexSLink})`;

    const addEmojiToMessage = (emoji: string) => {
      const emojis = emoji.repeat(emojiCount);
      const trendingPosition =
        trendingRank !== -1
          ? `[HypeTrending \\#${trendingRank}](${TRENDING_CHANNEL})`
          : "";

      const message = `*[${symbol}](${telegramLink || dexSLink}) Buy\\!*
${emojis}

🔀 ${sentNative} SOL *\\($${sentUsd}\\)*
🔀 ${formattedAmount} *${hardCleanUpBotMessage(symbol)}*
🪙 Position ${hardCleanUpBotMessage(position)}
👤 [Buyer](${buyerLink}) \\| [Txn](${txnLink}  )
💸 [Market Cap $${cleanUpBotMessage(fdv.toLocaleString("en"))}](${dexSLink})

[Photon](${photonLink}) \\| ${specialLink} \\| [Trending](${trendingLink})

${trendingPosition}`;

      return message;
    };

    // Sending Message
    for (const group of groups) {
      const { emoji, mediaType } = group;
      const message = addEmojiToMessage(emoji || "🟢");

      try {
        if (group.media) {
          if (mediaType === "gif") {
            await teleBot.api.sendAnimation(group.chatId, group.media, {
              parse_mode: "MarkdownV2",
              // @ts-expect-error Type not found
              disable_web_page_preview: true,
              caption: message,
            });
          } else {
            await teleBot.api.sendPhoto(group.chatId, group.media, {
              parse_mode: "MarkdownV2",
              // @ts-expect-error Type not found
              disable_web_page_preview: true,
              caption: message,
            });
          }
        } else {
          await teleBot.api.sendMessage(group.chatId, message, {
            parse_mode: "MarkdownV2",
            // @ts-expect-error Type not found
            disable_web_page_preview: true,
          });
        }
      } catch (error) {
        errorHandler(error);
        botRemovedError(error, group.chatId);
      }
    }
  } catch (error) {
    errorHandler(error);
  }
}
