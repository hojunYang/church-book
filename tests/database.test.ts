import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;
const sql = url ? postgres(url, { max: 1 }) : null;
const ledgerA = crypto.randomUUID();
const ledgerB = crypto.randomUUID();

run("PostgreSQL ledger isolation", () => {
  beforeAll(async () => {
    const migration = await readFile(new URL("../db/migrations/001_init.sql", import.meta.url), "utf8");
    await sql!.unsafe(migration);
    await sql!`
      INSERT INTO ledger_entries (id, ledger_id, kind, category, amount, entry_date, title)
      VALUES
        (${crypto.randomUUID()}, ${ledgerA}, 'expense', 'food', 1000, '2026-09-09', 'A 거래'),
        (${crypto.randomUUID()}, ${ledgerB}, 'income', 'salary', 5000, '2026-09-09', 'B 거래')
    `;
  });

  afterAll(async () => {
    await sql!`DELETE FROM ledger_entries WHERE ledger_id IN (${ledgerA}, ${ledgerB})`;
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
});
