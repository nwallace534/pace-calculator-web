# Pacerly

An open source running pace calculator that aims to solve issues I had with other pace calculators.

|                         Dark                         |                         Light                          |
| :--------------------------------------------------: | :----------------------------------------------------: |
| ![Pacerly in dark mode](docs/pacerly-start-dark.jpg) | ![Pacerly in light mode](docs/pacerly-start-light.jpg) |

## Goals

### Immediately useable by anyone on first visit

Starts with a default 5K, a sensible time and description, plus a goal/record picker to help choose your own. Advanced metrics are collapsed by default.

### Easy editing

- Separate field for each number (hours, minutes, seconds) so you can jump straight to the one you want.
- Auto-skip to the next field for quick text entry.
- Spinner buttons you can hold for fine tweaking — every nudge updates splits, speeds, and the Times for Pace table.

### Avoid getting lost in calculations

- Kilometres and miles always shown together for paces, speeds, and splits — no toggle-and-back round trips.
- Goal and record pickers to get back to a sensible calculation in one tap.
- Tool tip when going beyond world record pace or the boundaries of times.

### Track-aware advanced bits

- Middle-distance and track events adjust their splits. E.g. 1500m shows the first 300m and then 400m laps, with a quick summary: _"First 300m in 66 seconds · 400m laps in 88 seconds"_.
- Separate Custom modes for road and track, because the splits logic is different.

### Things other calculators tend to skip

- A full list of world records per event for quick selection. Fun to pick a marathon record and see how crazy the resulting splits look across every distance.
- Drive the whole thing without ever typing — just hold a spinner.
- Speeds (kph / mph) shown alongside paces.

## A note on AI

This is v2 — the first was a React app written before the AI revolution, with a small set of features I had time to build. AI has let me ship many more, but the code stays human-readable so you can edit it without AI if you ever need to. A calculator like this still has a place too: asking an AI gives you a different answer every time, this gives the same one on every device, and lets you nudge a pace by a single second or even hundredth to watch the effect on a column of distances instantly — something that would take a bigger AI prompt.

## Stack

Vite, React 19, Bootstrap 5, Zustand. Calculations come from the [`pace-calculator`](https://www.npmjs.com/package/pace-calculator) library, which I also wrote — pulling the maths into its own package keeps the UI code focused on UI, and the calculation engine can be reused elsewhere.

## Development

Clone the repo, install once, and you're ready to go:

```bash
npm install
npm run dev          # Vite dev server on http://localhost:5273
npm run lint         # ESLint
npm run format       # Prettier — auto-fix every file
npm test             # Full test suite (real browser, see below)
npm run build        # Production build
```

A `pre-commit` hook (husky + lint-staged) runs ESLint + Prettier on staged files, then `tsc --noEmit` and the full test suite, before any commit lands. It installs itself on `npm install`, so contributors don't have to think about it. Bypass with `git commit --no-verify` when truly needed.

### Testing

Tests run in a **real browser** (Vitest + Playwright), not jsdom. The app's behaviour relies on specific, hand-designed details — the spinner buttons' hold-and-repeat, the auto-skipping focus between time fields, real keyboard input, and how Bootstrap's CSS variables resolve under `data-bs-theme` — and jsdom approximations break in exactly those places. So tests run where the app actually runs.

A fuller architecture overview lives in [`CLAUDE.md`](./CLAUDE.md).

## Translations

The app is already wired for multiple languages via [`react-i18next`](https://react.i18next.com/) — all UI strings live in [`messages/en.json`](./messages/en.json), split into `theme`, `calculator`, and `events` namespaces. Adding a new locale is mostly translating the JSON and registering it in [`src/i18n/config.ts`](./src/i18n/config.ts). If this gets traction I'd love to ship more languages — open an issue or a PR.

## License

MIT — see [LICENSE](./LICENSE).
