export interface StoredGroup {
  token: string;
  chatId: string;
  pairs: string[];
  admins: number[];
  id?: string;
  emoji?: string;
  media?: string;
  mediaType?: "gif" | "photo";
}
