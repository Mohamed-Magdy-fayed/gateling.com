export const SEED_SYSTEM_ACTOR = "system:seed";
export const SEED_ADMIN_EMAIL = "root@gateling.com";
export const SEED_ADMIN_PASSWORD = "Make.1234";
export const SEED_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

export const SEED_CLIENT_ALAA_ID = "00000000-0000-0000-0000-000000000010";
export const SEED_CLIENT_HANY_ID = "00000000-0000-0000-0000-000000000011";
export const SEED_CLIENT_EMAN_ID = "00000000-0000-0000-0000-000000000012";
export const SEED_CLIENT_HUSSEIN_ID = "00000000-0000-0000-0000-000000000013";
export const SEED_CLIENT_WAEL_ID = "00000000-0000-0000-0000-000000000014";

export const SEED_CLIENT_ALAA_EMAIL = "alaa@client.gateling.com";
export const SEED_CLIENT_HANY_EMAIL = "hany@client.gateling.com";
export const SEED_CLIENT_EMAN_EMAIL = "eman@client.gateling.com";
export const SEED_CLIENT_HUSSEIN_EMAIL = "hussein@client.gateling.com";
export const SEED_CLIENT_WAEL_EMAIL = "wael@client.gateling.com";

export const SEED_CLIENT_ALAA_PASSWORD = "Client.Alaa.2024";
export const SEED_CLIENT_HANY_PASSWORD = "Client.Hany.2024";
export const SEED_CLIENT_EMAN_PASSWORD = "Client.Eman.2024";
export const SEED_CLIENT_HUSSEIN_PASSWORD = "Client.Hussein.2024";
export const SEED_CLIENT_WAEL_PASSWORD = "Client.Wael.2024";

// Client WhatsApp numbers (E.164) — used to request feedback via magic link.
export const SEED_CLIENT_EMAN_PHONE = "+201015824280";
export const SEED_CLIENT_WAEL_PHONE = "+201222289943";

export const SEED_PROFILE_NAMES = [
  "settings",
  "baseline",
  "demo",
  "performance",
] as const;

export type SeedProfileName = (typeof SEED_PROFILE_NAMES)[number];

export const DEFAULT_SEED_PROFILE: SeedProfileName = "settings";
