import { AdvertisementUserState, ToTrendUserState } from "@/types/userState";

export const userState: { [key: string]: string } = {};
export const trendingState: { [key: string]: ToTrendUserState } = {};
export const advertisementState: { [key: string]: AdvertisementUserState } = {};

export function setUserState(chatId: string | number, state: string) {
  userState[chatId] = state;
}

interface BotSetupState {
  tokenAddress: string;
  projectGroup: number;
}

export const botSetupState: { [key: number]: Partial<BotSetupState> } = {};

interface SettingsState {
  projectId: number;
}

export const settingsState: { [key: string]: SettingsState } = {};
