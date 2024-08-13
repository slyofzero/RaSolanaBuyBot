import { apiFetcher } from "@/utils/api";
import { TRENDING_AUTH_KEY, TRENDING_TOKENS_API } from "@/utils/env";
import { errorHandler } from "@/utils/handlers";

export let trendingMessageId: number = 0;
export async function syncTrendingMessageId() {
  try {
    const { messageId } = (
      await apiFetcher(`${TRENDING_TOKENS_API}/getLastMessage`, {
        Authorization: TRENDING_AUTH_KEY || "",
      })
    ).data as { messageId: number };

    trendingMessageId = Number(messageId);
  } catch (error) {
    errorHandler(error);
  }
}
