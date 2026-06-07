# AGENTS.md

This file provides guidance for working with code in this repository.

## Ground Rules

- The user will manage the git operations, stick to code only.
- Don't read `README.md`, `package-lock.json`, or `dist/` unless explicitly asked — they're not needed for context and cost tokens.
- Run `npm run lint` after edits. Don't start the dev server unless asked.
- If a message is obviously just a terminal command (e.g. `pwd`, `ls`, `npm run dev`), stop immediately — don't execute or analyse it. Assume it was meant for a shell and remind the user to use `! <cmd>` to run a command inline.

## Commands

```bash
npm run dev     # start dev server (Vite, esbuild)
npm run build   # production build (Rollup via Vite)
npm run lint    # ESLint
npm run reload  # clean reinstall — npm install --force (e.g. to restore the published pace-calculator after npm link)
```

## Constraints (don't "fix" these — they're intentional; see README for the why)

- **Inputs are text fields / strings, never `<input type="number">`.** Enables leading zeros, partial entry, and exact formatting.
- **Hours/minutes/seconds are separate fields**, with spinner buttons for fine adjustment. Don't combine them.
- **Bootstrap 5 only** — no second CSS framework. Dark mode toggles via `data-bs-theme`.
- **Fields are hidden per event** (e.g. `showHours` in `src/utils/events.ts`) — missing fields are deliberate, not bugs.
- **Default-then-remember:** an event loads preset values first, then remembers the user's own edits. Backed by `eventTimes` / `customDistance` in `src/state/distanceSlice.ts`.
- **No nested ternaries.** Prefer named variables, early returns, or small helper functions so conditional code stays easy to read.

## Architecture

Vite + React 19 single-page app. Entry point is `src/main.tsx`; root component is `src/App.tsx`; the calculator UI is composed from modules in `src/modules/`.

### State Management

All UI state lives in a single Zustand store (`src/state/useCalculatorStore.ts`) composed from slices. Centralisation is deliberate — nearly every piece of the UI derives from the same calculator state, so a single store avoids synchronisation complexity between components.

| Slice                  | Responsibility                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| `calculatorSlice`      | `computeMode`, theme, result-panel visibility, selected tabs, splits unit |
| `timeSlice`            | Time field strings for the time input                                     |
| `distanceSlice`        | Event selection, distance field strings, unit, per-event memory           |
| `paceSlice`            | Pace field strings + unit                                                 |
| `paceResultsSlice`     | Calculated pace, times by event/predictions source data, splits           |
| `distanceResultsSlice` | Calculated distance conversions                                           |
| `spinnerHintSlice`     | Spinner hold/tap hint learning state                                      |
| `savedDistancesSlice`  | User-saved custom distances for Times & predictions                       |
| `savedDurationsSlice`  | User-saved custom durations for Distance covered                          |

All time/distance/pace values in the store are **strings** (as typed by the user), not numbers. Conversion to numbers happens in `src/utils/input.ts` (`GetNumericValue`, `GetDecimalValue`).

### Calculation Flow

`ComputeMode` (Pace | Time | Distance) in `calculatorSlice` determines which calculation runs. The central function `getCalculationUpdate(state)` in `src/utils/calculator.ts` reads state, calls the appropriate `pace-calculator` library function, and returns updated result fields. Slices call this on every relevant setter so results stay in sync.

### i18n

All user-facing strings use `react-i18next`. Translation keys are in `messages/en.json`, split into `theme` and `events` namespaces. Components access strings via the `useTranslation` hook. Translation strings may contain HTML (e.g. `<strong>`) — these are rendered via `dangerouslySetInnerHTML` at the call site, which is safe as the content comes from the controlled translation file.
