export const INCOME_CATEGORIES = [
  { value: "regular_payment", label: "정기 지급" },
  { value: "special_payment", label: "특별 지급" },
  { value: "other", label: "기타" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "meal", label: "식사" },
  { value: "cafe", label: "카페" },
  { value: "transport", label: "교통" },
  { value: "other", label: "기타" },
] as const;

export type EntryKind = "income" | "expense";
export type Category =
  | (typeof INCOME_CATEGORIES)[number]["value"]
  | (typeof EXPENSE_CATEGORIES)[number]["value"];

export type Entry = {
  id: string;
  kind: EntryKind;
  category: Category;
  amount: number;
  entryDate: string;
  title: string;
  memo: string | null;
  createdAt: string;
};

export type EntryDraft = {
  kind: EntryKind;
  category: Category;
  amount: string;
  entryDate: string;
  title: string;
  memo: string;
};

export type MonthSummary = {
  carryover: number;
  income: number;
  expense: number;
  balance: number;
};

export type MonthlyTotal = {
  month: string;
  income: number;
  expense: number;
};

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const LEDGER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const MONTH_PATTERN = /^(19\d{2}|20\d{2}|2100)-(0[1-9]|1[0-2])$/;
export const DATE_PATTERN = /^(19\d{2}|20\d{2}|2100)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function isLedgerId(value: string) {
  return LEDGER_ID_PATTERN.test(value);
}

export function isMonth(value: string | undefined): value is string {
  return Boolean(value && MONTH_PATTERN.test(value));
}

export function getSeoulToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthIndex - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function calculateMonthSummary(totals: MonthlyTotal[], selectedMonth: string): MonthSummary {
  let previousBalance = 0;

  for (const total of totals) {
    if (total.month >= selectedMonth) break;
    previousBalance = Math.max(previousBalance, 0) + total.income - total.expense;
  }

  const current = totals.find((total) => total.month === selectedMonth);
  const carryover = Math.max(previousBalance, 0);
  const income = current?.income ?? 0;
  const expense = current?.expense ?? 0;

  return { carryover, income, expense, balance: carryover + income - expense };
}

export function validateEntryDraft(input: unknown):
  | { ok: true; value: Omit<EntryDraft, "amount" | "memo"> & { amount: number; memo: string | null } }
  | { ok: false; message: string } {
  if (!input || typeof input !== "object") return { ok: false, message: "입력값을 확인해 주세요." };

  const draft = input as Record<string, unknown>;
  const kind = draft.kind;
  const category = draft.category;
  const amountText = String(draft.amount ?? "").trim();
  const entryDate = String(draft.entryDate ?? "").trim();
  const title = String(draft.title ?? "").trim();
  const memo = String(draft.memo ?? "").trim();

  if (kind !== "income" && kind !== "expense") return { ok: false, message: "지급 또는 지출을 선택해 주세요." };

  const allowed = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!allowed.some((item) => item.value === category)) return { ok: false, message: "카테고리를 확인해 주세요." };

  if (!/^\d+$/.test(amountText)) return { ok: false, message: "금액은 원 단위의 양의 정수로 입력해 주세요." };
  const amount = Number(amountText);
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, message: "금액이 너무 크거나 올바르지 않습니다." };

  if (!DATE_PATTERN.test(entryDate)) return { ok: false, message: "날짜를 확인해 주세요." };
  const date = new Date(`${entryDate}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== entryDate) {
    return { ok: false, message: "존재하는 날짜를 입력해 주세요." };
  }

  if (!title || title.length > 100) return { ok: false, message: "내용은 1자 이상 100자 이하로 입력해 주세요." };
  if (memo.length > 500) return { ok: false, message: "메모는 500자 이하로 입력해 주세요." };

  return {
    ok: true,
    value: { kind, category: category as Category, amount, entryDate, title, memo: memo || null },
  };
}
