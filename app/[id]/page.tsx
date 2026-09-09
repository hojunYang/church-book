import { notFound } from "next/navigation";
import { LedgerView } from "@/components/ledger-view";
import { getLedgerMonth } from "@/lib/data";
import { getSeoulToday, isLedgerId, isMonth, shiftMonth } from "@/lib/ledger";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string | string[] }>;
};

export default async function LedgerPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  if (!isLedgerId(id)) notFound();

  const query = await searchParams;
  const requestedMonth = typeof query.month === "string" ? query.month : undefined;
  const month = isMonth(requestedMonth) ? requestedMonth : getSeoulToday().slice(0, 7);
  const { entries, summary } = await getLedgerMonth(id, month);

  return (
    <LedgerView
      ledgerId={id}
      month={month}
      previousMonth={shiftMonth(month, -1)}
      nextMonth={shiftMonth(month, 1)}
      entries={entries}
      summary={summary}
    />
  );
}
