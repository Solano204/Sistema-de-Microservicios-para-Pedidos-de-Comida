import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["PENDING", "Pendiente"],
    ["PAID", "Pagado"],
    ["APPROVED", "Aprobado"],
    ["CANCELLING", "Cancelando"],
    ["CANCELLED", "Cancelado"],
  ])("%s -> label %s, with a lowercased status modifier class", (status, label) => {
    render(<StatusBadge status={status} />);

    const el = screen.getByText(label);
    expect(el).toHaveClass(`badge--${status.toLowerCase()}`);
  });

  it("an unknown status echoes the raw value back as the label", () => {
    render(<StatusBadge status="MYSTERY" />);

    expect(screen.getByText("MYSTERY")).toHaveClass("badge--mystery");
  });
});
