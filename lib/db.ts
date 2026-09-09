import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL이 설정되지 않았습니다.");

  client ??= postgres(url, { max: 5, idle_timeout: 20 });
  return client;
}
