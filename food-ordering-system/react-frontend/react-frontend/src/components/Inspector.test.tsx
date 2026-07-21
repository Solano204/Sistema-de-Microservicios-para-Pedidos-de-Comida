import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Inspector from "./Inspector";
import type { ApiCallLog } from "../api";

describe("Inspector", () => {
  it("shows placeholder dashes when there is no log yet", () => {
    const { container } = render(<Inspector log={null} />);

    expect(container.querySelector("#lastRequest")).toHaveTextContent("—");
    expect(container.querySelector("#lastResponse")).toHaveTextContent("—");
  });

  it("reflects the method/url/body and status/body of the last call", () => {
    const log: ApiCallLog = {
      method: "POST",
      url: "http://localhost:8184/customers",
      requestBody: { username: "u1" },
      responseStatus: 201,
      responseBody: { customerId: "c1" },
    };
    const { container } = render(<Inspector log={log} />);

    const requestJson = JSON.parse(container.querySelector("#lastRequest")!.textContent!);
    expect(requestJson).toEqual({ method: "POST", url: "http://localhost:8184/customers", body: { username: "u1" } });
    const responseJson = JSON.parse(container.querySelector("#lastResponse")!.textContent!);
    expect(responseJson).toEqual({ status: 201, body: { customerId: "c1" } });
  });
});
