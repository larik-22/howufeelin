import { useContext, useMemo } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import { isRizel } from '@/utils/specialUsers';

/**
 * Determines if the signed-in user is Rizel **and** if today falls within her
 * birthday window. The birthday date is supplied via the environment variable
 * `VITE_RIZEL_BIRTHDAY` (format: YYYY-MM-DD).  In production this allows us to
 * update the birthday without shipping new code.  If the variable is missing
 * we default to enabling the banner for the entire day of July 8th.
 */
export function useBirthdayMode(windowInDays = 7): boolean {
  const auth = useContext(AuthContext);
  const email = auth?.firebaseUser?.email;

  return useMemo(() => {
    if (!isRizel(email)) return false;

    // Parse birthday from env (expected YYYY-MM-DD) or default to July 8.
    const envDate = import.meta.env.VITE_RIZEL_BIRTHDAY as string | undefined;
    const [year, month, day] = (envDate ?? `${new Date().getFullYear()}-07-03`)
      .split('-')
      .map(Number);
    const birthday = new Date(year, month - 1, day); // month is 0-based

    const today = new Date();
    // Adjust birthday to current year for comparison
    birthday.setFullYear(today.getFullYear());

    const diffInMs = Math.abs(today.getTime() - birthday.getTime());
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays <= windowInDays;
  }, [email, windowInDays]);
}
