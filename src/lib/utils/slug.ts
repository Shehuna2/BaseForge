const SLUG_REGEX = /^[a-z0-9-]{3,48}$/;

export const isValidSlug = (slug: string): boolean => SLUG_REGEX.test(slug);

export const normalizeWallet = (wallet: string): string => wallet.trim().toLowerCase();
