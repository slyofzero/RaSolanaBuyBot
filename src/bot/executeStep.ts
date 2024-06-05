import { CallbackQueryContext, CommandContext, Context } from "grammy";
import {
  addTrendingSocial,
  prepareTrendingState,
  selectTrendingDuration,
  setTrendingEmoji,
} from "./commands/trend";
import { userState } from "@/vars/state";
import { confirmPayment, preparePayment } from "./payment";
import {
  advertiseLink,
  prepareAdvertisementState,
  selectAdDuration,
} from "./commands/advertise";
import { log } from "@/utils/handlers";

const steps: { [key: string]: any } = {
  toTrend: addTrendingSocial,
  trendSocials: setTrendingEmoji,
  trendEmoji: selectTrendingDuration,
  // trendGif: selectTrendingDuration,
  trendDuration: prepareTrendingState,
  trendingPayment: confirmPayment,

  defaultEmoji: selectTrendingDuration,
  // defaultGif: selectTrendingDuration,

  advertiseText: advertiseLink,
  advertiseLink: selectAdDuration,
  adDuration: prepareAdvertisementState,
  adSlot: preparePayment,
  adPayment: confirmPayment,
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
