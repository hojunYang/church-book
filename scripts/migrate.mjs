import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL이 필요합니다.");

const sql = postgres(url, { max: 1 });
const directory = new URL("../db/migrations/", import.meta.url);
const migrations = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

try {
  for (const file of migrations) {
    await sql.unsafe(await readFile(new URL(file, directory), "utf8"));
  }
  console.log("데이터베이스 마이그레이션을 완료했습니다.");
} finally {
  await sql.end();
}
