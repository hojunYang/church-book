const SEOUL_OFFSET = 9 * 60 * 60 * 1000;
const MAX_SLEEP = 24 * 60 * 60 * 1000;

export function nextSeoulMonthStart(now = new Date()) {
  const seoulNow = new Date(now.getTime() + SEOUL_OFFSET);
  return new Date(
    Date.UTC(seoulNow.getUTCFullYear(), seoulNow.getUTCMonth() + 1, 1) - SEOUL_OFFSET,
  );
}

export async function sleepUntil(target) {
  while (target.getTime() > Date.now()) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(target.getTime() - Date.now(), MAX_SLEEP)));
  }
}
