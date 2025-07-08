import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useBirthdayMode } from '@/hooks/useBirthdayMode';

export default function BirthdayConfetti() {
  const birthdayMode = useBirthdayMode();
  const firedRef = useRef(false); // guard against StrictMode double-effect

  useEffect(() => {
    if (!birthdayMode) return;

    if (firedRef.current) return; // Already fired in this mount cycle
    firedRef.current = true;

    // Guard so confetti runs only once per session/tab
    if (sessionStorage.getItem('rizel-birthday-confetti')) return;
    sessionStorage.setItem('rizel-birthday-confetti', 'played');

    console.log('🎉 Firing simple birthday confetti');

    const colors = ['#FFCAD4', '#F9BCC6', '#ECB8CF', '#FABFD4'];

    const makeBurst = (params: Partial<confetti.Options>) =>
      confetti({
        particleCount: 180,
        spread: 120,
        gravity: 0.45,
        scalar: 1.6,
        ticks: 320,
        colors,
        zIndex: 9999,
        ...params,
      });

    // Wave 1 – center, then sides after 200 ms
    makeBurst({ origin: { x: 0.5, y: 0.1 } });
    setTimeout(() => makeBurst({ angle: 60, origin: { x: 0, y: 0.1 } }), 200);
    setTimeout(() => makeBurst({ angle: 120, origin: { x: 1, y: 0.1 } }), 200);

    // Wave 2 (lighter) after 800 ms for lingering effect
    setTimeout(
      () => makeBurst({ particleCount: 120, scalar: 1.3, spread: 140, origin: { x: 0.5, y: 0.2 } }),
      800
    );

    // Wave 3 (final drizzle) at 1300 ms
    setTimeout(
      () => makeBurst({ particleCount: 100, scalar: 1.1, spread: 160, origin: { x: 0.5, y: 0.3 } }),
      1300
    );
  }, [birthdayMode]);

  return null;
}
