import { urlRegex } from "./constants";

export function formatNumber(num: string | number) {
  num = Number(num);

  if (isNaN(num)) return 0;

  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return formatter.format(num);
}

export function isValidUrl(url: string) {
  return urlRegex.test(url);
}

export function roundUpToDecimalPlace(
  number: string | number,
  decimalPlaces: number
) {
  number = Number(number);

  const factor = 10 ** decimalPlaces;
  return Math.ceil(number * factor) / factor;
}

export function roundNumber(num: number, fixed?: number) {
  fixed ||= 2;
  const stringNum = String(num);
  let [match] = stringNum.match(/\.\d*?([1-9])/) as string[];
  match = match.replace(".", "");
  return num.toFixed(match.length + (fixed - 1));
}

export function toTitleCase(str: string) {
  return str.replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}

export function getRandomItemFromArray<T>(arr: T[]) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

export function isValidInviteLink(url: string) {
  return url.startsWith("https://t.me");
}

export function isValidTwitterLink(url: string) {
  return url.startsWith("https://x.com") && isValidUrl(url);
}

export function getRandomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
