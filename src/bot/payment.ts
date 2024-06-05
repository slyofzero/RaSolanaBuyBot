import {
  addDocument,
  getDocument,
  getDocumentById,
  updateDocumentById,
} from "@/firebase";
import { StoredAdvertisement } from "@/types";
import { StoredAccount } from "@/types/accounts";
import { StoredToTrend } from "@/types/trending";
import { cleanUpBotMessage } from "@/utils/bot";
import { adPrices, transactionValidTime, trendPrices } from "@/utils/constants";
import { decrypt, encrypt } from "@/utils/cryptography";
import { BOT_USERNAME, TRENDING_TOKENS_API } from "@/utils/env";
import { roundUpToDecimalPlace } from "@/utils/general";
import { errorHandler, log } from "@/utils/handlers";
import { getSecondsElapsed, sleep } from "@/utils/time";
import { generateAccount, splitPayment } from "@/utils/web3";
import { syncAdvertisements } from "@/vars/advertisements";
import { advertisementState, trendingState } from "@/vars/state";
import { syncToTrend } from "@/vars/toTrend";
import { Timestamp } from "firebase-admin/firestore";
import { CallbackQueryContext, Context, InlineKeyboard } from "grammy";
import { customAlphabet } from "nanoid";
import web3, { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { solanaConnection } from "@/rpc/config";
import { apiPoster } from "@/utils/api";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const length = 10; // You can change the length as needed
const nanoid = customAlphabet(alphabet, length);

export async function getUnlockedAccount() {
  let publicKey: string = "";

  const notLockedAccount = (
    await getDocument<StoredAccount>({
      collectionName: "accounts",
      queries: [["locked", "!=", true]],
    })
  ).at(0);

  // Only lock if the purchase isn't an admin purchase
  if (notLockedAccount) {
    publicKey = notLockedAccount.publicKey;
    updateDocumentById({
      id: notLockedAccount.id || "",
      collectionName: "accounts",
      updates: { locked: true, lockedAt: Timestamp.now() },
    });
  } else {
    const newAccount = generateAccount();
    publicKey = newAccount.publicKey;

    const newAccountData: StoredAccount = {
      publicKey,
      secretKey: encrypt(newAccount.secretKey),
      locked: true,
      lockedAt: Timestamp.now(),
    };

    addDocument({ data: newAccountData, collectionName: "accounts" });
  }

  return publicKey;
}

export async function preparePayment(ctx: CallbackQueryContext<Context>) {
  // @ts-expect-error weird
  const chatId = ctx.chat?.id as unknown as number | undefined;
  const username = ctx.from.username;
  if (!chatId || !username)
    return ctx.reply("Please restart the bot interaction again");

  const isTrendingPayment = Boolean(trendingState[chatId]);
  const commandToRedo = isTrendingPayment ? `/trend` : `/advertise`;
  const callbackReplace = isTrendingPayment ? `trendDuration` : `adDuration`;

  try {
    ctx.deleteMessage();
    const slot = Number(
      ctx.callbackQuery.data.replace(`${callbackReplace}-`, "").at(0)
    );
    const account = await getUnlockedAccount();
    const hash = nanoid(10);

    const { duration } = trendingState[chatId] || advertisementState[chatId];

    if (!duration || !slot)
      return ctx.reply(`Please do ${commandToRedo} again`);

    // ------------------------------ Calculating prices based on trend or ad buy ------------------------------
    // let priceUsd = 0;
    // if (isTrendingPayment) {
    //   priceUsd = trendPrices[duration][slot - 1];
    // } else {
    //   priceUsd = adPrices[duration];
    // }

    // const ethPrice = (await apiFetcher<any>(ethPriceApi)).data.price;
    // const priceSol = parseFloat((priceUsd / ethPrice).toFixed(8));

    // ------------------------------ Calculating prices based on trend or ad buy ------------------------------
    let priceSol = 0;

    if (isTrendingPayment) {
      priceSol = trendPrices[slot as 1 | 2 | 3][duration];
    } else {
      priceSol = adPrices[duration];
    }

    const slotText = isTrendingPayment ? "trending" : "ad";
    const displaySlot = !isTrendingPayment
      ? slot
      : slot === 1
      ? "1-3"
      : slot === 2
      ? "3-10"
      : "11-20";

    const paymentCategory = isTrendingPayment ? "trendingPayment" : "adPayment";
    let text = `You have selected ${slotText} slots ${displaySlot} for ${duration} hours.
The total cost - \`${roundUpToDecimalPlace(priceSol, 4)}\` SOL

Send the bill amount to the below address within 20 minutes, starting from this message generation. Once paid, click on "I have paid" to verify payment. If 20 minutes have already passed then please restart using ${commandToRedo}. 

Address - \`${account}\``;

    text = text.replace(/\./g, "\\.").replace(/-/g, "\\-");
    const keyboard = new InlineKeyboard().text(
      "I have paid",
      `${paymentCategory}-${hash}`
    );

    ctx.reply(text, { parse_mode: "MarkdownV2", reply_markup: keyboard });

    const collectionName = isTrendingPayment ? "to_trend" : "advertisements";
    let dataToAdd: StoredToTrend | StoredAdvertisement = {
      paidAt: Timestamp.now(),
      sentTo: account,
      amount: priceSol * LAMPORTS_PER_SOL,
      slot: slot,
      duration: duration,
      hash,
      status: "PENDING",
      initiatedBy: chatId,
      username,
    } as StoredToTrend | StoredAdvertisement;

    if (isTrendingPayment) {
      const { token, social, emoji } = trendingState[chatId];
      dataToAdd = {
        ...dataToAdd,
        // @ts-expect-error weird
        token: token || "",
        socials: social || "",
        emoji: emoji || "",
      };
    } else {
      const { text, link } = advertisementState[chatId];
      dataToAdd = {
        ...dataToAdd,
        text: text || "",
        link: link || "",
      };
    }

    addDocument({
      collectionName,
      data: dataToAdd,
      id: hash,
    });

    delete trendingState[chatId];
    delete advertisementState[chatId];

    return true;
  } catch (error) {
    errorHandler(error);
    ctx.reply(
      `An error occurred. Please don't follow with the payment and instead do ${commandToRedo} in the same way you used earlier.`
    );

    return false;
  }
}

export async function confirmPayment(ctx: CallbackQueryContext<Context>) {
  try {
    const from = ctx.from;
    const callbackData = ctx.callbackQuery.data;
    const [category, hash] = callbackData.split("-");
    const isTrendingPayment = category === "trendingPayment";
    const collectionName = isTrendingPayment ? "to_trend" : "advertisements";

    if (!from || !callbackData || !hash) {
      return ctx.reply("Please click on the button again");
    }

    const confirmingMessage = await ctx.reply(
      "Checking for payment receival, a confirmation message would be sent to you in a short while. Expected time - 60 seconds"
    );

    const trendingPayment = await getDocumentById<StoredToTrend>({
      collectionName,
      id: hash,
    });

    if (!trendingPayment) {
      log(`Payment not found for hash ${hash}`);
      return await ctx.reply(
        `Your payment wasn't found. Please contact the admins and provide them the hash - ${hash}.`
      );
    }

    const { paidAt, sentTo, amount, duration, slot } = trendingPayment;
    const timeSpent = getSecondsElapsed(paidAt.seconds);

    if (timeSpent > transactionValidTime) {
      log(`Transaction ${hash} has expired`);
      return await ctx.reply(
        `Your payment duration has expired. You were warned not to pay after 20 minutes of payment message generation. If you have already paid, contact the admins.`
      );
    }

    const storedAccount = (
      await getDocument<StoredAccount>({
        queries: [["publicKey", "==", sentTo]],
        collectionName: "accounts",
      })
    ).at(0);

    if (!storedAccount) {
      log(`Account for payment hash ${hash} not found`);
      const text = `The account your payment was sent to wasn't found. Please contact the admins and provide them the hash - \`${hash}\`.`;
      // teleBot.api
      //   .sendMessage(LOGS_CHANNEL_ID || "", cleanUpBotMessage(text), {
      //     parse_mode: "MarkdownV2",
      //   })
      //   .catch((e) => errorHandler(e));
      return await ctx.reply(cleanUpBotMessage(text), {
        parse_mode: "MarkdownV2",
      });
    }

    const { secretKey: encryptedSecretKey } = storedAccount;
    const secretKey = decrypt(encryptedSecretKey);
    const account = web3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(secretKey))
    );

    attemptsCheck: for (const attempt_number of Array.from(Array(20).keys())) {
      try {
        log(
          `Checking for subscription payment, Attempt - ${attempt_number + 1}`
        );

        // Checking if payment was made
        const balance = await solanaConnection.getBalance(account.publicKey);

        if (balance < amount) {
          log(`Transaction amount doesn't match`);
          await sleep(10000);
          continue attemptsCheck;
        }

        const amountSol = (amount / LAMPORTS_PER_SOL).toFixed(3);

        const logText = `${BOT_USERNAME} transaction ${hash} for ${collectionName} verified with payment of ${amountSol} SOL.\nSlot ${slot}, duration ${duration} hours`;
        log(logText);
        const currentTimestamp = Timestamp.now();

        // teleBot.api
        //   .sendMessage(PAYMENT_LOGS_CHANNEL_ID || "", logText)
        //   .catch((e) => errorHandler(e));

        await updateDocumentById({
          updates: {
            status: "PAID",
            paidAt: currentTimestamp,
            expiresAt: new Timestamp(
              currentTimestamp.seconds + duration * 60 * 60,
              currentTimestamp.nanoseconds
            ),
          },
          collectionName,
          id: hash,
        });

        const confirmationText = `You have purchased a trending slot ${slot} for ${duration} hours.
Payment received of - \`${roundUpToDecimalPlace(amountSol, 4)}\` SOL

Transaction hash for your payment is \`${hash}\`. Your token would be visible, and available to be scanned the next time the bot updates the trending message, so it may take a minute or two. In case of any doubts please reach out to the admins of the bot for any query.

Address Payment Received at - ${sentTo}`;

        const syncFunc = isTrendingPayment ? syncToTrend : syncAdvertisements;

        if (isTrendingPayment) {
          apiPoster(`${TRENDING_TOKENS_API}/syncTrending`).catch((e) =>
            errorHandler(e)
          );
        } else {
          apiPoster(`${TRENDING_TOKENS_API}/syncAdvertisements`).catch((e) =>
            errorHandler(e)
          );
        }

        syncFunc()
          .then(() => {
            ctx.reply(cleanUpBotMessage(confirmationText), {
              parse_mode: "MarkdownV2",
            });
          })
          .then(() => {
            ctx.deleteMessage().catch((e) => errorHandler(e));
            ctx
              .deleteMessages([confirmingMessage.message_id])
              .catch((e) => errorHandler(e));
          })
          .catch((e) => errorHandler(e));

        // Splitting payment
        splitPayment(secretKey, balance);
        // .then(() => {
        //   updateDocumentById({
        //     updates: { locked: false },
        //     collectionName: "accounts",
        //     id: accountID || "",
        //   });
        // })
        // .catch((e) => errorHandler(e));

        return true;
      } catch (error) {
        errorHandler(error);
        await sleep(10000);
      }
    }

    log(`Account for payment hash ${hash} not found`);
    const failedText = `Your payment wasn't confirmed. Please contact the admins and provide your payment hash - \`${hash}\``;
    // teleBot.api
    //   .sendMessage(
    //     LOGS_CHANNEL_ID || "",
    //     cleanUpBotMessage(cleanUpBotMessage(failedText)),
    //     {
    //       parse_mode: "MarkdownV2",
    //     }
    //   )
    //   .catch((e) => errorHandler(e));
    ctx.reply(failedText).catch((e) => errorHandler(e));
  } catch (error) {
    errorHandler(error);
    ctx.reply(`An error occurred, please try again`);
  }
}
