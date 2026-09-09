import { describe, expect, it } from "vitest";
import { isUuid } from "../lib/ledger";
import { ledgerIdToUuid } from "../lib/ledger-id";

describe("ledgerIdToUuid", () => {
  it("같은 영문 ID를 항상 같은 UUID로 변환한다", () => {
    const first = ledgerIdToUuid("my-church");
    expect(ledgerIdToUuid("my-church")).toBe(first);
    expect(isUuid(first)).toBe(true);
  });

  it("서로 다른 영문 ID를 다른 UUID로 변환한다", () => {
    expect(ledgerIdToUuid("my-church")).not.toBe(ledgerIdToUuid("another-church"));
  });
});
