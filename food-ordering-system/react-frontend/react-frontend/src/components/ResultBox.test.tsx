import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ResultBox from "./ResultBox";

describe("ResultBox", () => {
  it("renders an empty result div when there is no result", () => {
    const { container } = render(<ResultBox result={null} />);

    expect(container.querySelector("div.result")).toBeInTheDocument();
    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  it("renders the success class, title, and JSON-stringified data", () => {
    render(<ResultBox result={{ kind: "success", title: "It worked", data: { id: 1 } }} />);

    expect(screen.getByText("It worked").parentElement).toHaveClass("result--success");
    // getByText normalizes the DOM's whitespace but not a multi-line matcher
    // string, so a pretty-printed <pre> block needs an exact textContent check.
    expect(document.querySelector("pre.result__data")?.textContent).toBe(
      JSON.stringify({ id: 1 }, null, 2),
    );
  });

  it("renders the error class and omits the data block when data is undefined", () => {
    const { container } = render(<ResultBox result={{ kind: "error", title: "Failed" }} />);

    expect(container.querySelector(".result--error")).toBeInTheDocument();
    expect(container.querySelector("pre.result__data")).not.toBeInTheDocument();
  });

  it("renders extra content between the title and the data block", () => {
    render(<ResultBox result={{ kind: "success", title: "Done", extra: <span>Extra bit</span> }} />);

    expect(screen.getByText("Extra bit")).toBeInTheDocument();
  });
});
