import "server-only";

import { db } from "@/lib/db";
import { calculateMonthSummary, type Category, type Entry, type EntryKind } from "@/lib/ledger";
import { ledgerIdToUuid } from "@/lib/ledger-id";

type RawTotal = { month: string; income: string; expense: string };
type RawEntry = {
  id: string;
  kind: EntryKind;
  category: Category;
  amount: string;
  entry_date: string;
  title: string;
  memo: string | null;
  created_at: Date;
};

export async function getLedgerMonth(ledgerId: string, month: string) {
  const sql = db();
  const internalLedgerId = ledgerIdToUuid(ledgerId);
  const nextMonth = new Date(`${month}-01T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const [rawTotals, rawEntries] = await Promise.all([
    sql<RawTotal[]>`
      SELECT
        to_char(entry_date, 'YYYY-MM') AS month,
        COALESCE(sum(amount) FILTER (WHERE kind = 'income'), 0)::text AS income,
        COALESCE(sum(amount) FILTER (WHERE kind = 'expense'), 0)::text AS expense
      FROM ledger_entries
      WHERE ledger_id = ${internalLedgerId} AND entry_date < ${monthEnd}
      GROUP BY 1
      ORDER BY 1
    `,
    sql<RawEntry[]>`
      SELECT id, kind, category, amount::text, entry_date::text, title, memo, created_at
      FROM ledger_entries
      WHERE ledger_id = ${internalLedgerId}
        AND entry_date >= ${`${month}-01`}
        AND entry_date < ${monthEnd}
      ORDER BY entry_date DESC, created_at DESC
    `,
  ]);

  const totals = rawTotals.map((total) => ({
    month: total.month,
    income: Number(total.income),
    expense: Number(total.expense),
  }));
  const entries: Entry[] = rawEntries.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    category: entry.category,
    amount: Number(entry.amount),
    entryDate: entry.entry_date,
    title: entry.title,
    memo: entry.memo,
    createdAt: new Date(entry.created_at).toISOString(),
  }));

  return { entries, summary: calculateMonthSummary(totals, month) };
}
