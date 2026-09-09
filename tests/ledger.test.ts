import { describe, expect, it } from "vitest";
import { calculateMonthSummary, isLedgerId, validateEntryDraft } from "../lib/ledger";

describe("isLedgerId", () => {
  it("영문·숫자·하이픈 ID를 허용한다", () => {
    expect(isLedgerId("church")).toBe(true);
    expect(isLedgerId("family-budget-2026")).toBe(true);
  });

  it("공백, 한글, 특수문자와 잘못된 길이를 거부한다", () => {
    expect(isLedgerId("my church")).toBe(false);
    expect(isLedgerId("교회")).toBe(false);
    expect(isLedgerId("church_book")).toBe(false);
    expect(isLedgerId("ab")).toBe(false);
  });
});

describe("calculateMonthSummary", () => {
  it("첫 달은 이월금 0원에서 계산한다", () => {
    expect(calculateMonthSummary([{ month: "2026-09", income: 500_000, expense: 120_000 }], "2026-09"))
      .toEqual({ carryover: 0, income: 500_000, expense: 120_000, balance: 380_000 });
  });

  it("전달의 양수 잔액을 이월한다", () => {
    expect(calculateMonthSummary([
      { month: "2026-08", income: 300_000, expense: 100_000 },
      { month: "2026-09", income: 50_000, expense: 80_000 },
    ], "2026-09")).toEqual({ carryover: 200_000, income: 50_000, expense: 80_000, balance: 170_000 });
  });

  it("음수 잔액은 다음 달 이월금에서 0원이 된다", () => {
    expect(calculateMonthSummary([
      { month: "2026-07", income: 10_000, expense: 30_000 },
      { month: "2026-08", income: 5_000, expense: 9_000 },
      { month: "2026-09", income: 20_000, expense: 3_000 },
    ], "2026-09")).toEqual({ carryover: 0, income: 20_000, expense: 3_000, balance: 17_000 });
  });

  it("거래가 없는 달에도 양수 잔액을 유지한다", () => {
    expect(calculateMonthSummary([
      { month: "2026-06", income: 100_000, expense: 20_000 },
      { month: "2026-09", income: 0, expense: 10_000 },
    ], "2026-09")).toEqual({ carryover: 80_000, income: 0, expense: 10_000, balance: 70_000 });
  });
});

describe("validateEntryDraft", () => {
  const valid = { kind: "expense", category: "food", amount: "12000", entryDate: "2026-09-09", title: "점심", memo: "" };

  it("올바른 거래 입력을 정규화한다", () => {
    expect(validateEntryDraft(valid)).toEqual({ ok: true, value: { ...valid, amount: 12000, memo: null } });
  });

  it("유형과 맞지 않는 카테고리를 거부한다", () => {
    expect(validateEntryDraft({ ...valid, kind: "income" })).toMatchObject({ ok: false });
  });

  it("0원, 비정상 날짜, 너무 긴 내용을 거부한다", () => {
    expect(validateEntryDraft({ ...valid, amount: "0" })).toMatchObject({ ok: false });
    expect(validateEntryDraft({ ...valid, entryDate: "2026-02-30" })).toMatchObject({ ok: false });
    expect(validateEntryDraft({ ...valid, title: "가".repeat(101) })).toMatchObject({ ok: false });
  });
});
