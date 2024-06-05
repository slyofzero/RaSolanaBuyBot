import { addDocument, getDocument, updateDocumentById } from "@/firebase";
import { BotCommandContextType, StoredGroup } from "@/types";
import { cleanUpBotMessage } from "@/utils/bot";
import { BOT_USERNAME, WEBHOOK_URL } from "@/utils/env";
import { onlyAdmin } from "../utils";
import { syncProjectGroups } from "@/vars/projectGroups";
import { trend } from "./trend";
import { advertise } from "./advertise";
import { errorHandler, log } from "@/utils/handlers";
import web3 from "@solana/web3.js";
import { apiFetcher } from "@/utils/api";
import { TokenData } from "@/types/token";

export async function startBot(ctx: BotCommandContextType) {
  if (!WEBHOOK_URL) {
    return log(`WEBHOOK_URL is undefined`);
  }

  try {
    const { match: token } = ctx;
    const { id: chatId, type } = ctx.chat;
    let text = `Welcome to ${BOT_USERNAME}!!!\n\n`;

    if (type === "private") {
      text += `What can this bot do?

@${BOT_USERNAME} is to be added to your project telegram. By adding @${BOT_USERNAME} to your project, you will be able to view  the buys, marketcap and transactions real time. Hype your project with a dedicated buy bot today!

◦ /start : To start the buybot
◦ /settings : Opens the menu to add a token, gif, telegram group link and adjust any available settings for the buy bot
◦ /advertise : To buy an ad slot on our bot
◦ /trend : To trend your token`;

      const { match } = ctx;

      switch (match) {
        case "trend": {
          trend(ctx);
          break;
        }
        case "adBuyRequest": {
          advertise(ctx);
          break;
        }
        default: {
          return await ctx.reply(text, {
            // @ts-expect-error Type not found
            disable_web_page_preview: true,
          });
        }
      }
    } else {
      const isAdmin = await onlyAdmin(ctx);
      if (!isAdmin) return false;

      if (token) {
        text = `This ${type} would now get updates for \`${token}\` buys. Each time the bot detects a buy for your token, a message would be sent in this group with some data about it.

To configure buybot;
type /settings`;

        try {
          new web3.PublicKey(token);
          const data = (
            await apiFetcher<TokenData>(
              `https://api.dexscreener.com/latest/dex/tokens/${token}`
            )
          ).data;

          const firstPair = data?.pairs.at(0);
          const pairs = data.pairs.map(({ pairAddress }) => pairAddress);

          if (!data || !firstPair) {
            log(`No data found for ${token}`);
            return ctx.reply(
              `No data found for ${token}. Either the token address you passed is invalid, or dexscreener doesn't have data about this token`
            );
          }

          const projectData = (
            await getDocument<StoredGroup>({
              collectionName: "project_groups",
              queries: [["chatId", "==", String(chatId)]],
            })
          ).at(0);

          if (projectData) {
            await ctx.reply(cleanUpBotMessage(text), {
              parse_mode: "MarkdownV2",
            });
            await updateDocumentById<StoredGroup>({
              updates: { token, pairs },
              collectionName: "project_groups",
              id: projectData.id || "",
            });
          } else {
            await ctx.reply(cleanUpBotMessage(text), {
              parse_mode: "MarkdownV2",
            });
            const data: StoredGroup = {
              chatId: String(chatId),
              token,
              pairs,
            };
            await addDocument<StoredGroup>({
              data,
              collectionName: "project_groups",
            });
          }

          syncProjectGroups();
        } catch (error) {
          errorHandler(error);
          await ctx.reply("The token address you passed was incorrect.");
        }
      } else {
        text += `To start the buy, add \\@${BOT_USERNAME} as an admin \\(this allows the bot to send messages\\) and then do /start in the below format -\n/start \\<token address\\>.`;
        await ctx.reply(cleanUpBotMessage(text), { parse_mode: "MarkdownV2" });
      }
    }
  } catch (error) {
    errorHandler(error);
  }
}
