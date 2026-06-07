import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import { DistanceUnit } from "pace-calculator";
import App from "@/App";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  SAVED_DISTANCE_CAP,
  STORAGE_KEY,
  STORAGE_VERSION,
  loadSavedDistances,
} from "@/state/savedDistancesSlice";
import { selectEvent, timesForPaceCard } from "./helpers";

const seedSavedDistance = (
  distanceValue: number,
  distanceUnit: DistanceUnit,
) => {
  useCalculatorStore
    .getState()
    .addSavedDistance({ distanceValue, distanceUnit });
};

describe("Saved custom distances — render and remove", () => {
  it("renders a saved distance as a row in the Times & predictions table with a Custom badge", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    seedSavedDistance(10, DistanceUnit.Miles);

    const card = timesForPaceCard();
    const labelCell = await within(card).findByText(/10 mile/i);
    const row = labelCell.closest("tr")!;
    expect(within(row).getByText("Custom")).toBeInTheDocument();
  });

  it("inserts the saved row at its meters-sorted position between built-ins", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    // 8K should slot between 5K and 10K.
    seedSavedDistance(8, DistanceUnit.Kilometers);

    const card = timesForPaceCard();
    // Wait for the saved row to render before sampling row order.
    await within(card).findByText("8K");

    const labels = within(card)
      .getAllByRole("row")
      .slice(1) // skip header
      .map((row) => within(row).getAllByRole("cell")[0].textContent ?? "");

    // The saved row's "Custom ×" badge button appends to the cell's textContent
    // — match labels with a non-digit lookbehind so the "5K"-seeking probe
    // can't false-match a future "15K" or similar.
    const fiveKIdx = labels.findIndex((l) => /(^|[^\d])5K/.test(l));
    const eightKIdx = labels.findIndex((l) => /(^|[^\d])8K/.test(l));
    const tenKIdx = labels.findIndex((l) => /(^|[^\d])10K/.test(l));

    expect(fiveKIdx).toBeGreaterThanOrEqual(0);
    expect(tenKIdx).toBeGreaterThan(fiveKIdx);
    expect(eightKIdx).toBeGreaterThan(fiveKIdx);
    expect(eightKIdx).toBeLessThan(tenKIdx);
  });

  it("removes a saved distance when its Custom badge is clicked", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    seedSavedDistance(10, DistanceUnit.Miles);

    const card = timesForPaceCard();
    const row = (await within(card).findByText(/10 mile/i)).closest("tr")!;
    const removeBtn = within(row).getByRole("button", {
      name: /remove custom distance/i,
    });
    await userEvent.click(removeBtn);

    expect(within(card).queryByText(/10 mile/i)).toBeNull();
    expect(useCalculatorStore.getState().savedDistances).toHaveLength(0);
  });

  it("highlights the saved row when in Custom mode and the entered distance matches", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    seedSavedDistance(8, DistanceUnit.Kilometers);

    await selectEvent("Custom");
    // Enter 8 km / 40 min so paceResults compute and the table renders.
    await userEvent.fill(
      document.getElementById("distance") as HTMLInputElement,
      "8",
    );
    await userEvent.fill(screen.getByLabelText("minutes"), "40");

    const card = timesForPaceCard();
    const row = (await within(card).findByText(/8K/i)).closest("tr")!;
    expect(row.className).toContain("fw-bold");

    // No separate inline custom row injected — only the saved row carries 8K.
    const eightKRows = within(card)
      .getAllByText(/8K/i)
      .map((el) => el.closest("tr"));
    const uniqueRows = new Set(eightKRows);
    expect(uniqueRows.size).toBe(1);
  });

  it("falls back to inline custom row when the entered distance matches no saved distance", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    seedSavedDistance(8, DistanceUnit.Kilometers);

    await selectEvent("Custom");
    // 9 km / 45 min — non-matching distance, with a time so pace computes.
    await userEvent.fill(
      document.getElementById("distance") as HTMLInputElement,
      "9",
    );
    await userEvent.fill(screen.getByLabelText("minutes"), "45");

    const card = timesForPaceCard();
    // Inline custom row label format: "9K".
    expect(await within(card).findByText("9K")).toBeInTheDocument();
  });

  it("inserts an inline custom row before a saved row when the entered distance is shorter", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    // Saved 8K; enter 7K in Custom (no built-in matches 7K).
    seedSavedDistance(8, DistanceUnit.Kilometers);

    await selectEvent("Custom");
    await userEvent.fill(
      document.getElementById("distance") as HTMLInputElement,
      "7",
    );
    await userEvent.fill(screen.getByLabelText("minutes"), "40");

    const card = timesForPaceCard();
    // Wait for the inline 7K row to render before sampling row order.
    await within(card).findByText("7K");

    const labels = within(card)
      .getAllByRole("row")
      .slice(1) // skip header
      .map((row) => within(row).getAllByRole("cell")[0].textContent ?? "");

    const sevenKIdx = labels.findIndex((l) => /(^|[^\d])7K/.test(l));
    const eightKIdx = labels.findIndex((l) => /(^|[^\d])8K/.test(l));
    expect(sevenKIdx).toBeGreaterThanOrEqual(0);
    expect(eightKIdx).toBeGreaterThan(sevenKIdx);
  });

  it("keeps saved rows in the table when the selected event changes", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    seedSavedDistance(8, DistanceUnit.Kilometers);

    // Default event is 5K — confirm the saved row is there.
    let card = timesForPaceCard();
    expect(await within(card).findByText("8K")).toBeInTheDocument();

    await selectEvent("marathon");
    card = timesForPaceCard();
    expect(await within(card).findByText("8K")).toBeInTheDocument();

    await selectEvent("tenK");
    card = timesForPaceCard();
    expect(await within(card).findByText("8K")).toBeInTheDocument();
  });
});

describe("Saved custom distances — add form", () => {
  const openForm = async () =>
    userEvent.click(
      screen.getByRole("button", { name: /add custom distance/i }),
    );

  const wholeInput = () =>
    document.getElementById("savedDistanceWhole") as HTMLInputElement;

  const fractionalInput = () =>
    document.getElementById("savedDistanceFractional") as HTMLInputElement;

  it("adds a custom distance via the form and shows it in the table", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));
    await openForm();

    expect(wholeInput()).toHaveValue("00");
    expect(fractionalInput()).toHaveValue("00");

    await userEvent.fill(wholeInput(), "10");
    // Default unit is Kilometers — change to Miles via the native select.
    await userEvent.selectOptions(
      document.getElementById("savedDistanceUnit") as HTMLSelectElement,
      DistanceUnit.Miles,
    );

    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    const card = timesForPaceCard();
    expect(await within(card).findByText(/10 mile/i)).toBeInTheDocument();
    // Sheet closes on successful save.
    expect(document.getElementById("savedDistanceWhole")).toBeNull();
  });

  it("shows the empty-input error and does not save", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));
    await openForm();

    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /enter a distance/i,
    );
    expect(useCalculatorStore.getState().savedDistances).toHaveLength(0);
  });

  it("shows the built-in duplicate error when matching a catalog event", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));
    await openForm();

    // 5 km matches the built-in 5K.
    await userEvent.fill(wholeInput(), "5");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText(/5K is already in the list/i),
    ).toBeInTheDocument();
    expect(useCalculatorStore.getState().savedDistances).toHaveLength(0);
  });

  it("shows the saved-duplicate error when matching an already-saved distance", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    seedSavedDistance(7, DistanceUnit.Kilometers);

    await openForm();
    await userEvent.fill(wholeInput(), "7");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText(/that distance is already saved/i),
    ).toBeInTheDocument();
    expect(useCalculatorStore.getState().savedDistances).toHaveLength(1);
  });

  it("cancel collapses the form and discards input", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));
    await openForm();
    await userEvent.fill(wholeInput(), "10");
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(document.getElementById("savedDistanceWhole")).toBeNull();

    // Reopen — the fields should return to their anti-autofill defaults.
    await openForm();
    expect(wholeInput()).toHaveValue("00");
    expect(fractionalInput()).toHaveValue("00");
  });

  it("header close button collapses the form and discards input", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));
    await openForm();
    await userEvent.fill(wholeInput(), "10");
    await userEvent.click(screen.getByRole("button", { name: /^close$/i }));

    expect(document.getElementById("savedDistanceWhole")).toBeNull();

    await openForm();
    expect(wholeInput()).toHaveValue("00");
    expect(fractionalInput()).toHaveValue("00");
  });

  it("backdrop click collapses the form and discards input", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));
    await openForm();
    await userEvent.fill(wholeInput(), "10");

    const backdrop = document.querySelector(
      ".offcanvas-backdrop",
    ) as HTMLElement;
    await userEvent.click(backdrop);

    expect(document.getElementById("savedDistanceWhole")).toBeNull();

    await openForm();
    expect(wholeInput()).toHaveValue("00");
    expect(fractionalInput()).toHaveValue("00");
  });

  it("disables the trigger at the cap", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    // Distinct sub-kilometre distances offset from the 100/200/400/800m
    // built-ins to avoid collisions.
    for (let i = 0; i < SAVED_DISTANCE_CAP; i++) {
      seedSavedDistance(0.05 + i * 0.1, DistanceUnit.Kilometers);
    }

    const trigger = await screen.findByRole("button", {
      name: /add custom distance/i,
    });
    expect(trigger).toBeDisabled();
    expect(screen.getByText("Limit reached")).toBeVisible();
  });
});

describe("Saved custom distances — persistence", () => {
  it("persists added distances to localStorage in the documented envelope", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times & predictions"));

    seedSavedDistance(8, DistanceUnit.Kilometers);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(STORAGE_VERSION);
    expect(parsed.savedDistances).toHaveLength(1);
    expect(parsed.savedDistances[0]).toMatchObject({
      distanceValue: 8,
      distanceUnit: DistanceUnit.Kilometers,
    });
  });

  it("hydrates the slice from localStorage on next load", async () => {
    // Pre-seed localStorage as if the user already had a saved distance.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        savedDistances: [
          {
            id: "fixture-id",
            distanceValue: 12,
            distanceUnit: DistanceUnit.Miles,
          },
        ],
      }),
    );

    // loadSavedDistances simulates the slice's init path on a fresh page load.
    const hydrated = loadSavedDistances();
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]).toMatchObject({
      distanceValue: 12,
      distanceUnit: DistanceUnit.Miles,
    });
  });
});
