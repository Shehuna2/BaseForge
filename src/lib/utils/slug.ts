const SLUG_REGEX = /^[a-z0-9-]{3,48}$/;
const WALLET_REGEX = /^0x[a-f0-9]{40}$/;

export const isValidSlug = (slug: string): boolean => SLUG_REGEX.test(slug);

export const normalizeWallet = (wallet: string): string => wallet.trim().toLowerCase();

export const isValidWallet = (wallet: string): boolean => WALLET_REGEX.test(wallet);
