export const SPECIAL_USERS = {
  RIZEL: 'rzlthms11@gmail.com',
} as const;

export const isSpecialUser = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return Object.values(SPECIAL_USERS).includes(
    email as (typeof SPECIAL_USERS)[keyof typeof SPECIAL_USERS]
  );
};

export const isRizel = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email === SPECIAL_USERS.RIZEL;
};

// Development utilities
export const simulateSpecialUser = (email: string): string => {
  if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_SIMULATE_RIZEL === 'true') {
    return SPECIAL_USERS.RIZEL;
  }
  return email;
};
