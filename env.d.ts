declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string | undefined;
      FIREBASE_KEY: string | undefined;
      HTTP_CLIENT: string | undefined;
      TON_API_KEY: string | undefined;
      WSS_ENDPOINT: string | undefined;
      BOT_USERNAME: string | undefined;
      TRENDING_BOT_USERNAME: string | undefined;
      TONCLIENT_ENDPOINT: string | undefined;
      TONCLIENT_API_KEY: string | undefined;
      EXPLORER_URL: string | undefined;
      DEX_URL: string | undefined;
      GECKO_API: string | undefined;
      TRENDING_TOKENS_API: string | undefined;
      TRENDING_AUTH_KEY: string | undefined;
      TRENDING_CHANNEL_ID: string | undefined;
      TRENDING_CHANNEL: string | undefined;
      PORT: string | undefined;
      COINGECKO_API_KEY: string | undefined;
      MAIN_ADDRESS: string | undefined;
      TRENDING_PRICES: string | undefined;
      AD_PRICES: string | undefined;
      RPC_ENDPOINT: string | undefined;
      HELIS_API_KEY: string | undefined;
      WEBHOOK_URL: string | undefined;
      TRENDING_BOT_TOKENS: string | undefined;
    }
  }
}

export {};
