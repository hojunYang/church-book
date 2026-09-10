import postgres from "postgres";
import { nextSeoulMonthStart, sleepUntil } from "./monthly-grant-schedule.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL이 필요합니다.");

const watch = process.argv.includes("--watch");
const sql = postgres(url, { max: 1 });

do {
  try {
    const [result] = await sql`SELECT grant_monthly_allowance() AS count`;
    console.log(`[${new Date().toISOString()}] 월 지급금 ${result.count}건을 추가했습니다.`);
  } catch (error) {
    if (!watch) throw error;
    console.error("월 지급금 배치에 실패했습니다. 1분 뒤 다시 시도합니다.", error);
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    continue;
  }

  if (watch) {
    const nextRun = nextSeoulMonthStart();
    console.log(`다음 실행: ${nextRun.toISOString()} (Asia/Seoul 매월 1일 00:00)`);
    await sleepUntil(nextRun);
  }
} while (watch);

await sql.end();
