#!/usr/bin/env node
// Dev utility: spits out a grid of summary-card screenshots — every built-in
// event × small/medium/large portrait viewport — so you can eyeball many
// cards at once when tuning the design.
//
// Usage:
//   1. In one terminal: `npm run dev`
//   2. In another:      `npm run screenshot:cards`
//      (override the dev URL with `BASE_URL=…` if you've moved the port)
//
// Output: ./screenshots/cards/<viewport-name>/<event-id>.png
//
// Add or trim EVENT_GOALS / VIEWPORTS to widen or narrow the sweep.

import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5273";
const OUT_DIR = `${ROOT}/screenshots/cards`;

// Portrait phone presets: small / medium / large. Large matches the card's
// own max (Pixel 9 Pro XL CSS dimensions), so it should fill the viewport.
const VIEWPORTS = [
  { name: "small", width: 360, height: 640 }, // older Android
  { name: "medium", width: 390, height: 844 }, // iPhone 13/14 standard
  { name: "large", width: 448, height: 998 }, // Pixel 9 Pro XL
];

// One goal time per built-in event. Picked to either hit a catalogued label
// ("Sub 30 mins ⚡") or land at a typical recreational target — whichever
// gives a more representative card.
const EVENT_GOALS = [
  { id: "oneHundredMeters", h: 0, m: 0, s: 15, cs: 0 },
  { id: "twoHundredMeters", h: 0, m: 0, s: 30, cs: 0 },
  { id: "fourHundredMeters", h: 0, m: 1, s: 5, cs: 0 },
  { id: "eightHundredMeters", h: 0, m: 2, s: 30, cs: 0 },
  { id: "fifteenHundredMeters", h: 0, m: 5, s: 30, cs: 0 },
  { id: "mile", h: 0, m: 6, s: 0, cs: 0 },
  { id: "threeThousandMeters", h: 0, m: 12, s: 0, cs: 0 },
  { id: "fiveK", h: 0, m: 25, s: 0, cs: 0 },
  { id: "tenK", h: 0, m: 50, s: 0, cs: 0 },
  { id: "halfMarathon", h: 1, m: 50, s: 0, cs: 0 },
  { id: "marathon", h: 4, m: 0, s: 0, cs: 0 },
];

const buildUrl = ({ id, h, m, s, cs }) => {
  const p = new URLSearchParams({ event: id, view: "summary" });
  if (h) p.set("h", String(h));
  if (m) p.set("m", String(m));
  if (s) p.set("s", String(s));
  if (cs) p.set("cs", String(cs));
  return `${BASE_URL}/?${p.toString()}`;
};

async function main() {
  console.log(`base url:  ${BASE_URL}`);
  console.log(`out dir:   ${OUT_DIR}`);

  // Wipe previous run so stale event ids don't linger if the catalog shrinks.
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  let count = 0;

  try {
    for (const viewport of VIEWPORTS) {
      const dir = `${OUT_DIR}/${viewport.name}`;
      await mkdir(dir, { recursive: true });
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
      });

      console.log(`\n${viewport.name} (${viewport.width}×${viewport.height})`);
      for (const goal of EVENT_GOALS) {
        const url = buildUrl(goal);
        const page = await context.newPage();
        try {
          await page.goto(url, { waitUntil: "networkidle" });
          await page.waitForSelector('[data-testid="summary-card"]', {
            timeout: 5000,
          });
          // Let the flip-in finish (180ms) before snapping.
          await page.waitForTimeout(220);
          const path = `${dir}/${goal.id}.png`;
          await page.screenshot({ path, fullPage: true });
          console.log(`  ✓ ${goal.id}.png`);
          count++;
        } catch (err) {
          console.error(`  ✗ ${goal.id}: ${err.message}`);
        } finally {
          await page.close();
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n${count} screenshots → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
