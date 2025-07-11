export const SPECIAL_USERS = {
  RIZEL: import.meta.env.VITE_RIZELS_EMAIL,
  ILARION: 'larikpetriv@gmail.com',
} as const;

export const isSpecialUser = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return Object.values(SPECIAL_USERS).includes(
    email as (typeof SPECIAL_USERS)[keyof typeof SPECIAL_USERS]
  );
};

export const isRizel = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email === SPECIAL_USERS.RIZEL || email === SPECIAL_USERS.ILARION;
};

// Development utilities
export const simulateSpecialUser = (): string => {
  return SPECIAL_USERS.ILARION;
};
