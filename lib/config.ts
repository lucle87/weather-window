// Cau hinh server Weather Window. Tra phi qua MPP tren Tempo (USDC.e).
// Data tu Open-Meteo (free, khong key), khong doc on-chain.

export type NetworkName = "mainnet" | "testnet";

export const NETWORK: NetworkName =
  (process.env.TEMPO_NETWORK as NetworkName) || "mainnet";

export const IS_TESTNET = NETWORK === "testnet";

export const PRICE = process.env.PULSE_PRICE || "0.020000";
export const PRICE_AMOUNT = process.env.PULSE_PRICE_AMOUNT || "0.02";

// Token nhan tien: USDC.e tren Tempo. KHONG dung USDT0.
export const PAY_TOKEN = (process.env.PAY_TOKEN ||
  "0x20c000000000000000000000b9537d11c60e8b50") as `0x${string}`;

export const RECIPIENT_ADDRESS = (process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS ||
  process.env.RECIPIENT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Cat dau "/" cuoi de tranh double slash trong llms/openapi.
export const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  ""
);

export const REALM_HOST = (() => {
  try {
    return new URL(BASE_URL).host;
  } catch {
    return "localhost:3000";
  }
})();

export const MPP_SECRET_KEY =
  process.env.MPP_SECRET_KEY || "dev-secret-change-me-in-production-please-32b";

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "lucle87@example.com";
