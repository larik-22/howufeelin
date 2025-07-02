# Upcoming Birthday Features

The following features will be rolled out for Rizel's birthday.
We keep the scope small, production-ready, and toggle-able via a single hook so they never impact other users.

1. **Birthday Banner in Navbar** – A subtle, text-only banner that greets Rizel on her birthday week.
2. **Confetti on First Page Load** – A celebratory confetti burst triggered only once per session.
3. **Birthday Mood Emoji** – A special "🎂" or "🥳" emoji added to the mood picker for the birthday period.

Each feature will be guarded by `useBirthdayMode()` so they are visible **only** when:

- the signed-in user matches `isRizel()`; and
- today lies within the configurable birthday window (default ±7 days).
