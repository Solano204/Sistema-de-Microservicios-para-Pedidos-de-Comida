import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfigForm from "./ConfigForm";
import { loadConfig } from "../config";

describe("ConfigForm", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => vi.useRealTimers());

  it("pre-fills both inputs from the currently-saved config", () => {
    render(<ConfigForm />);

    expect(screen.getByLabelText("URL customer-service")).toHaveValue("http://localhost:8184");
    expect(screen.getByLabelText("URL order-service")).toHaveValue("http://localhost:8181");
  });

  it("saving persists the trimmed URLs and shows a confirmation that clears after ~2s", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ConfigForm />);

    const customerInput = screen.getByLabelText("URL customer-service");
    await user.clear(customerInput);
    await user.type(customerInput, "  http://example.test:1  ");
    await user.click(screen.getByRole("button", { name: "Guardar configuración" }));

    expect(loadConfig().customerServiceUrl).toBe("http://example.test:1");
    expect(screen.getByText("Configuracion guardada.")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2000); });

    expect(screen.queryByText("Configuracion guardada.")).not.toBeInTheDocument();
  });
});
