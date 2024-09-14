import { Address } from "@ton/ton";

export const firebaseCollectionPrefix = "_ra_solana_bot";

export const defaultBuyGif =
  "BAACAgUAAx0Ef6pfowACL0RmLjjEQ8k-j8XrmlfbFxD9zhKEbgACtA4AAo5ZcFWQUmJZiWQE0DQE";

export const whitelistedPools = [
  // "EQBCwe_IObXA4Mt3RbcHil2s4-v4YQS3wUDt1-DvZOceeMGO",
  // "EQCBwglxhJgTue5tMPX4KE0O1it4dNjD_f53WM8asjgMiSYx",
  // "EQAoB_Eu83hGRiJ5WFnLn77m98TCNYNfhhE4AUuNNFAzsSkV",
  // "EQCO9NDT4Il25_4ZpHIOgMAUbRJvpsI9pLzqhD8X7eTVB7X_",
  "EQAE0eK1xx3CfQIrqxTxLsI0Nd-nKhDBW3cp-mNVZWOn_MT5",
  "EQDlxf_1othGgTZihxp3CZspogqctK8FEbVIDAa9NmTa7383",
].map((address) => Address.parse(address).toRawString());

export const bannedTokens = [
  "0:8cdc1d7640ad5ee326527fc1ad0514f468b30dc84b0173f0e155f451b4e11f7c",
];

export const trendingIcons = [
  "🥇",
  "🥈",
  "🥉",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
  "1️⃣1️⃣",
  "1️⃣2️⃣",
  "1️⃣3️⃣",
  "1️⃣4️⃣",
  "1️⃣5️⃣",
  "1️⃣6️⃣",
  "1️⃣7️⃣",
  "1️⃣8️⃣",
  "1️⃣9️⃣",
  "2️⃣0️⃣",
];
export const workchain = 0;
export const avgGasFees = 0.025;
export const defaultEmoji = "🟢";
export const minBuy = 1;

export const trendPrices: { [key: number]: { [key: number]: number } } = {
  1: { 3: 1, 6: 6, 12: 10, 24: 15, 48: 30 },
  2: { 3: 3, 6: 5, 12: 9, 24: 13, 48: 26 },
  3: { 3: 2, 6: 4, 12: 8, 24: 12, 48: 23 },
};

export const adPrices: { [key: number]: number } = {
  4: 300,
  12: 750,
  24: 1250,
};
export const urlRegex =
  /^(?:https?|ftp):\/\/(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w-]*)*\/?(?:\?[^#\s]*)?$/;
export const transactionValidTime = 25 * 60;

export interface SplitPayments {
  dev: { address: string; share: number };
  revenue: { address: string; share: number };
  main: { address: string; share: number };
}
export const splitPaymentsWith: SplitPayments = {
  dev: {
    address: "ELMXLPCtKjDVSTgNXdHBM7kHhC9yUzxBZYpmGfLsaGVC",
    share: 0.35,
  },
  revenue: {
    address: "ELMXLPCtKjDVSTgNXdHBM7kHhC9yUzxBZYpmGfLsaGVC",
    share: 0.1,
  },
  main: {
    address: "ELMXLPCtKjDVSTgNXdHBM7kHhC9yUzxBZYpmGfLsaGVC",
    share: 0.55,
  },
};

export const ethPriceApi =
  "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT";
