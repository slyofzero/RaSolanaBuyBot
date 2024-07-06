import { cleanUpPendingAdvertisements } from "./advertisement";

export async function cleanUpExpired() {
  await Promise.all([cleanUpPendingAdvertisements()]);
}
