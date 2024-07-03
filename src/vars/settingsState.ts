type SetEmojiState = { projectChatId: string; emoji: string };
export const setEmojiState: { [key: string]: Partial<SetEmojiState> } = {};

type SetMediaState = { projectChatId: string; gif: string };
export const setMediaState: { [key: string]: Partial<SetMediaState> } = {};
