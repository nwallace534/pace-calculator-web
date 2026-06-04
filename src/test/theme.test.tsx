import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";

describe("Theme toggle", () => {
  it("flips data-bs-theme on <html> and persists the choice to localStorage", async () => {
    render(<App />);

    // The test harness resets the store to "light" between cases, so the
    // initial render lands in light regardless of OS preference.
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
      "light",
    );

    const toggle = screen.getByRole("button", { name: /toggle dark mode/i });
    await userEvent.click(toggle);

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");

    // Flipping back updates both the attribute and the persisted value.
    await userEvent.click(toggle);
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
      "light",
    );
    expect(window.localStorage.getItem("theme")).toBe("light");
  });

  it("swaps the navbar logo asset on toggle", async () => {
    render(<App />);
    const logo = screen.getByAltText("Pacerly logo") as HTMLImageElement;
    expect(logo.getAttribute("src")).toMatch(/pacerly-full-logo-light\.svg$/);

    const toggle = screen.getByRole("button", { name: /toggle dark mode/i });
    await userEvent.click(toggle);

    expect(logo.getAttribute("src")).toMatch(/pacerly-full-logo-dark\.svg$/);
  });
});
