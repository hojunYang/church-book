import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL이 필요합니다.");

const watch = process.argv.includes("--watch");
const sql = postgres(url, { max: 1 });

do {
  let retryDelay = 60 * 60 * 1000;
  try {
    const [result] = await sql`SELECT grant_monthly_allowance() AS count`;
    console.log(`[${new Date().toISOString()}] 월 지급금 ${result.count}건을 추가했습니다.`);
  } catch (error) {
    if (!watch) throw error;
    retryDelay = 60 * 1000;
    console.error("월 지급금 배치에 실패했습니다. 1분 뒤 다시 시도합니다.", error);
  }

  if (watch) await new Promise((resolve) => setTimeout(resolve, retryDelay));
} while (watch);

await sql.end();
