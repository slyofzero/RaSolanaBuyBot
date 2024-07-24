import dotenv from "dotenv";

export const { NODE_ENV } = process.env;
dotenv.config({
  path: NODE_ENV === "development" ? ".env" : ".env.production",
});

export const {
  BOT_TOKEN,
  BOT_USERNAME,
  ENCRYPTION_KEY,
  FIREBASE_KEY,
  PORT,
  RPC_ENDPOINT,
  TRENDING_AUTH_KEY,
  TRENDING_CHANNEL,
  TRENDING_TOKENS_API,
  GYSER_WSS_URL,
} = process.env;

export const TRENDING_BOT_TOKENS: string[] = JSON.parse(
  process.env.TRENDING_BOT_TOKENS || "[]"
);
