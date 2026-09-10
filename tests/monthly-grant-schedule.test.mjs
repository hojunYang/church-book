import { describe, expect, it } from "vitest";
import { nextSeoulMonthStart } from "../scripts/monthly-grant-schedule.mjs";

describe("nextSeoulMonthStart", () => {
  it("서울 시간의 다음 달 1일 자정을 계산한다", () => {
    expect(nextSeoulMonthStart(new Date("2026-09-10T12:00:00Z")).toISOString())
      .toBe("2026-09-30T15:00:00.000Z");
  });

  it("연도가 바뀌는 경우도 계산한다", () => {
    expect(nextSeoulMonthStart(new Date("2026-12-31T16:00:00Z")).toISOString())
      .toBe("2027-01-31T15:00:00.000Z");
  });
});
