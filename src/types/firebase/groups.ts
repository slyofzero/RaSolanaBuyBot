export interface StoredGroup {
  token: string;
  chatId: string;
  pairs: string[];
  id?: string;
  emoji?: string | null;
  media?: string | null;
  mediaType?: "video" | "photo" | null;
  minBuy?: number;
  websiteLink?: string;
  telegramLink?: string;
  twitterLink?: string;
}
