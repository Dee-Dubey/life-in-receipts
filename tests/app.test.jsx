import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import App from "../src/App.jsx";

// jsdom has no layout, so colour-contrast can't be computed here (it is checked by hand in the README).
async function expectNoA11yViolations(container) {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary).toEqual([]);
}

beforeEach(() => {
  // no bundled dataset in the test environment -> app falls back to sample data
  globalThis.fetch = () => Promise.resolve({ ok: false, headers: new Headers(), text: () => Promise.resolve("") });
});

async function renderApp() {
  const utils = render(<App />);
  await waitFor(() => expect(screen.getByText(/showing generated sample data/i)).toBeInTheDocument());
  return utils;
}

describe("App", () => {
  it("renders the home view with a single h1 and passes axe", async () => {
    const { container } = await renderApp();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  it("navigates every tab and each passes axe", async () => {
    const user = userEvent.setup();
    const { container } = await renderApp();
    for (const name of ["Chapters", "Search", "Connections"]) {
      await user.click(screen.getByRole("button", { name }));
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-current", "page");
      expect(document.title).toContain(name);
      await expectNoA11yViolations(container);
    }
  });

  it("opens a chapter as an accessible dialog, closes on Escape and restores focus", async () => {
    const user = userEvent.setup();
    const { container } = await renderApp();
    await user.click(screen.getByRole("button", { name: "Chapters" }));
    const card = screen.getByRole("button", { name: /^Open January/ });
    await user.click(card);

    const dialog = screen.getByRole("dialog", { name: "January" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveFocus();
    await expectNoA11yViolations(container);

    // Tab stays inside the dialog
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(card).toHaveFocus();
  });

  it("steps between chapters with the buttons and the arrow keys (wrapping around the year)", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Chapters" }));
    await user.click(screen.getByRole("button", { name: /^Open January/ }));
    expect(screen.getByRole("dialog", { name: "January" })).toBeInTheDocument();

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /February/ }));
    expect(screen.getByRole("dialog", { name: "February" })).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("dialog", { name: "December" })).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "January" })).toBeInTheDocument();
  });

  it("copies the month as a text receipt and announces it", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Chapters" }));
    await user.click(screen.getByRole("button", { name: /^Open March/ }));

    let copied = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: (t) => {
          copied = t;
          return Promise.resolve();
        },
      },
      configurable: true,
    });
    await user.click(screen.getByRole("button", { name: "Copy as text" }));
    await waitFor(() => expect(screen.getAllByText(/March receipt copied/i).length).toBeGreaterThan(0));
    expect(copied).toContain("MARCH");
    expect(copied).toContain("YOUR LIFE, IN RECEIPTS");
  });

  it("defining-day cards on Connections are real buttons that open the dialog", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Connections" }));
    const list = screen.getByRole("list");
    const first = within(list).getAllByRole("button")[0];
    await user.click(first);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("search filters results and announces the count", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Search" }));
    const status = screen.getByRole("status");
    const before = status.textContent;
    await user.type(screen.getByLabelText(/search notes/i), "zzzz-no-such-thing");
    await waitFor(() => expect(status).toHaveTextContent(/^0 matches$/));
    expect(before).not.toBe("0 matches");
    expect(screen.getByText(/no receipts match/i)).toBeInTheDocument();
  });

  it("shows a helpful message instead of wiping data when no file is chosen", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Build my story" }));
    expect(screen.getByText(/choose at least one csv/i)).toBeInTheDocument();
  });
});
