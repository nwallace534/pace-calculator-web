import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  SAVED_DURATION_CAP,
  SAVED_DURATION_STORAGE_KEY,
  SAVED_DURATION_STORAGE_VERSION,
} from "@/state/savedDurationsSlice";
import { howFarInCard, selectEvent } from "./helpers";

const openHowFarIn = async () => {
  render(<App />);
  await userEvent.click(screen.getByText("How far in..."));
  return howFarInCard();
};

const openCustomDurationForm = async () => {
  await userEvent.click(
    screen.getByRole("button", { name: /add custom duration/i }),
  );
};

const durationInput = (id: "howFarHours" | "howFarMinutes" | "howFarSeconds") =>
  document.getElementById(id) as HTMLInputElement;

const saveCustomDuration = async () =>
  userEvent.click(screen.getByRole("button", { name: /^save$/i }));

describe("How far in — default rows and units", () => {
  it("renders the built-in durations at the current pace", async () => {
    const card = await openHowFarIn();

    expect(within(card).getByText("At 05:59 /km pace")).toBeInTheDocument();
    expect(within(card).getByText("Show in miles")).toBeInTheDocument();

    const rows = within(card).getAllByRole("row");
    expect(rows).toHaveLength(1 + 3);
    expect(rows[1]).toHaveTextContent("30 minutes");
    expect(rows[1]).toHaveTextContent("5K");
    expect(rows[2]).toHaveTextContent("1 hour");
    expect(rows[2]).toHaveTextContent("10K");
    expect(rows[3]).toHaveTextContent("2 hours");
    expect(rows[3]).toHaveTextContent("20K");
  });

  it("toggles the table between K and miles", async () => {
    const card = await openHowFarIn();

    await userEvent.click(within(card).getByText("Show in miles"));
    expect(within(card).getByText("Show in K")).toBeInTheDocument();

    const rows = within(card).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("3.1 mi");
    expect(rows[2]).toHaveTextContent("6.2 mi");
    expect(rows[3]).toHaveTextContent("12.4 mi");
  });

  it("defaults to miles for mile-based events", async () => {
    render(<App />);
    await selectEvent("marathon");
    await userEvent.click(screen.getByText("How far in..."));

    const card = howFarInCard();
    expect(within(card).getByText("Show in K")).toBeInTheDocument();
    expect(within(card).getAllByRole("row")[1]).toHaveTextContent("mi");
  });
});

describe("How far in — custom durations", () => {
  it("adds, persists, and removes a custom duration", async () => {
    const card = await openHowFarIn();
    await openCustomDurationForm();

    expect(durationInput("howFarHours")).toHaveValue("00");
    expect(durationInput("howFarMinutes")).toHaveValue("00");
    expect(durationInput("howFarSeconds")).toHaveValue("00");

    await userEvent.fill(durationInput("howFarMinutes"), "22");
    await saveCustomDuration();

    const customRow = await within(card).findByText("22 minutes");
    const row = customRow.closest("tr")!;
    expect(row).toHaveTextContent("3.7K");
    expect(within(row).getByText("Custom")).toBeInTheDocument();

    const raw = window.localStorage.getItem(SAVED_DURATION_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(SAVED_DURATION_STORAGE_VERSION);
    expect(parsed.savedDurations).toHaveLength(1);
    expect(parsed.savedDurations[0].seconds).toBe(22 * 60);

    await userEvent.click(
      within(row).getByRole("button", { name: /remove custom duration/i }),
    );
    expect(within(card).queryByText("22 minutes")).toBeNull();
    expect(useCalculatorStore.getState().savedDurations).toHaveLength(0);
  });

  it("shows validation errors and clears them when the user edits", async () => {
    await openHowFarIn();
    await openCustomDurationForm();

    await saveCustomDuration();
    expect(await screen.findByText("Enter a duration.")).toBeInTheDocument();

    await userEvent.fill(durationInput("howFarMinutes"), "30");
    expect(screen.queryByText("Enter a duration.")).toBeNull();

    await saveCustomDuration();
    expect(
      await screen.findByText("That duration is already in the list."),
    ).toBeInTheDocument();

    await userEvent.fill(durationInput("howFarMinutes"), "22");
    expect(
      screen.queryByText("That duration is already in the list."),
    ).toBeNull();
  });

  it("keeps saved custom durations when the selected event changes", async () => {
    const card = await openHowFarIn();
    await openCustomDurationForm();
    await userEvent.fill(durationInput("howFarMinutes"), "22");
    await saveCustomDuration();

    expect(await within(card).findByText("22 minutes")).toBeInTheDocument();

    await selectEvent("marathon");
    expect(within(howFarInCard()).getByText("22 minutes")).toBeInTheDocument();

    await selectEvent("tenK");
    expect(within(howFarInCard()).getByText("22 minutes")).toBeInTheDocument();
  });

  it("disables custom duration entry at the cap and shows the limit note", async () => {
    for (let i = 0; i < SAVED_DURATION_CAP; i++) {
      useCalculatorStore.getState().addSavedDuration({ seconds: 5 + i });
    }

    const card = await openHowFarIn();
    const trigger = within(card).getByRole("button", {
      name: /add custom duration/i,
    });

    expect(trigger).toBeDisabled();
    expect(within(card).getByText("Limit reached")).toBeInTheDocument();
  });
});
