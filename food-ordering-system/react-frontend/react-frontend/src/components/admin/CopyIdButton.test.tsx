import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CopyIdButton from "./CopyIdButton";

// jsdom has no real navigator.clipboard, so Object.defineProperty is used to
// stub it - but userEvent.setup() installs its own clipboard polyfill
// internally, which silently overwrites anything stubbed *before* it. The
// stub must be (re-)applied *after* userEvent.setup() runs, not before.
function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("CopyIdButton", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "clipboard", { value: originalClipboard, configurable: true });
  });

  it("writes the value to the clipboard and shows a confirmation that clears after ~1.5s", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup({ delay: null });
    stubClipboard(writeText);
    render(<CopyIdButton value="abc-123" />);

    await user.click(screen.getByRole("button", { name: "Copiar id" }));

    expect(writeText).toHaveBeenCalledWith("abc-123");
    expect(screen.getByRole("button", { name: "✓ copiado" })).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1500); });

    expect(screen.getByRole("button", { name: "Copiar id" })).toBeInTheDocument();
  });

  it("still shows the confirmation even if the clipboard API is unavailable", async () => {
    const user = userEvent.setup({ delay: null });
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<CopyIdButton value="abc-123" />);

    await user.click(screen.getByRole("button", { name: "Copiar id" }));

    expect(screen.getByRole("button", { name: "✓ copiado" })).toBeInTheDocument();
  });
});
