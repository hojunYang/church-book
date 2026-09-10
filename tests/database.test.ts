import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;
const sql = url ? postgres(url, { max: 1 }) : null;
const ledgerA = crypto.randomUUID();
const ledgerB = crypto.randomUUID();
const ledgerC = crypto.randomUUID();

run("PostgreSQL ledger isolation", () => {
  beforeAll(async () => {
    const directory = new URL("../db/migrations/", import.meta.url);
    const migrations = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
    for (const file of migrations) await sql!.unsafe(await readFile(new URL(file, directory), "utf8"));
    await sql!`
      INSERT INTO ledger_entries (id, ledger_id, kind, category, amount, entry_date, title)
      VALUES
        (${crypto.randomUUID()}, ${ledgerA}, 'expense', 'meal', 1000, '2026-09-09', 'A 거래'),
        (${crypto.randomUUID()}, ${ledgerB}, 'income', 'regular_payment', 5000, '2026-09-09', 'B 거래')
    `;
  });

  afterAll(async () => {
    await sql!`DELETE FROM ledger_entries WHERE ledger_id IN (${ledgerA}, ${ledgerB}, ${ledgerC})`;
    await sql!`DELETE FROM ledger_books WHERE id IN (${ledgerA}, ${ledgerB}, ${ledgerC})`;
    await sql!.end();
  });

  it("ledger_id별로 조회 결과가 분리된다", async () => {
    const entriesA = await sql!`SELECT title FROM ledger_entries WHERE ledger_id = ${ledgerA}`;
    const entriesB = await sql!`SELECT title FROM ledger_entries WHERE ledger_id = ${ledgerB}`;
    expect(entriesA.map((entry) => entry.title)).toEqual(["A 거래"]);
    expect(entriesB.map((entry) => entry.title)).toEqual(["B 거래"]);
  });

  it("다른 가계부 ID로는 수정하거나 삭제할 수 없다", async () => {
    const changed = await sql!`
      UPDATE ledger_entries SET title = '변경됨'
      WHERE ledger_id = ${ledgerB} AND title = 'A 거래'
      RETURNING id
    `;
    const deleted = await sql!`
      DELETE FROM ledger_entries
      WHERE ledger_id = ${ledgerB} AND title = 'A 거래'
      RETURNING id
    `;
    expect(changed).toHaveLength(0);
    expect(deleted).toHaveLength(0);
  });

  it("빈 장부에도 월 지급금을 한 번만 추가한다", async () => {
    await sql!`
      INSERT INTO ledger_books (id, slug)
      VALUES (${ledgerC}, ${`test-${ledgerC.slice(0, 8)}`})
    `;

    const [first] = await sql!`SELECT grant_monthly_allowance(${ledgerC}) AS count`;
    const [second] = await sql!`SELECT grant_monthly_allowance(${ledgerC}) AS count`;
    const entries = await sql!`
      SELECT kind, category, amount::int, title,
             to_char(entry_date, 'YYYY-MM') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul', 'YYYY-MM') AS current_month
      FROM ledger_entries
      WHERE ledger_id = ${ledgerC}
    `;

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);
    expect(entries).toEqual([{
      kind: "income",
      category: "regular_payment",
      amount: 50_000,
      title: "월 지급금",
      current_month: true,
    }]);
  });
});
