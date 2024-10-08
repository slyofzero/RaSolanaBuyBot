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
import { trendingIcons } from "@/utils/constants";
import { getRandomNumber } from "@/utils/general";
import { StoredGroup } from "@/types";
import { trendingMessageId } from "@/vars/message";

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
    const { priceNative, priceUsd, fdv } = tokenData;
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

    const displayFdv = fdv
      ? Number(
          (
            Number(fdv) +
            sentUsdNumber +
            sentUsdNumber * getRandomNumber(0, 2)
          ).toFixed(2)
        ).toLocaleString("en")
      : 0;

    // links
    const buyerLink = `https://solscan.io/account/${buyer}`;
    const txnLink = `https://solscan.io/tx/${signature}`;
    const dexSLink = `https://dexscreener.com/solana/${token}`;
    const photonLink = `https://photon-sol.tinyastro.io/en/lp/${token}`;
    const trendingRank = Object.entries(trendingTokens).findIndex(
      ([trendingToken]) => trendingToken === token
    );

    const updateMessageForGroup = (group: StoredGroup) => {
      const { emoji, websiteLink, telegramLink, twitterLink } = group;
      const emojis = emoji?.repeat(emojiCount);

      const links = {
        Website: websiteLink,
        Telegram: telegramLink,
        Twitter: twitterLink,
      };

      const specialLinks = Object.entries(links)
        .filter(([, link]) => link)
        .map(([label, link]) => `[${label}](${link})`)
        .join(" \\| ");
      const specialLinksText = specialLinks ? `\\| ${specialLinks} \\|` : "\\|";

      const trendingPosition =
        trendingRank !== -1
          ? `[${trendingIcons[trendingRank]} \\#${
              trendingRank + 1
            } on Hype Solana Trending](${TRENDING_CHANNEL})`
          : "";

      const message = `*[${hardCleanUpBotMessage(symbol)}](${
        telegramLink || dexSLink
      }) Buy\\!*
${emojis}

🔀 ${sentNative} SOL *\\($${sentUsd}\\)*
🔀 ${formattedAmount} *${hardCleanUpBotMessage(symbol)}*
🪙 Position *${hardCleanUpBotMessage(position)}*
👤 [Buyer](${buyerLink}) \\| [Txn](${txnLink}  )
💸 [Market Cap](${dexSLink}) *$${cleanUpBotMessage(displayFdv)}*

[Photon](${photonLink}) ${specialLinksText} [Trending](${TRENDING_CHANNEL}/${trendingMessageId})

${trendingPosition}`;

      return message;
    };

    // Sending Message
    for (const group of groups) {
      const { mediaType, minBuy } = group;
      if (sentUsd < Number(minBuy)) continue;
      const message = updateMessageForGroup(group);

      try {
        if (group.media) {
          if (mediaType === "video") {
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
