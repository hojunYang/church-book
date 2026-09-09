import { db } from "@/lib/db";
import { isLedgerId } from "@/lib/ledger";
import { LEDGER_CHANGES_CHANNEL, ledgerIdToUuid } from "@/lib/ledger-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isLedgerId(id)) return new Response(null, { status: 404 });

  const encoder = new TextEncoder();
  const internalLedgerId = ledgerIdToUuid(id);
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const listener = await db().listen(LEDGER_CHANGES_CHANNEL, (changedLedgerId) => {
    if (!closed && changedLedgerId === internalLedgerId) {
      controller?.enqueue(encoder.encode("event: change\ndata: updated\n\n"));
    }
  });

  const close = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    void listener.unlisten();
  };

  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
      controller.enqueue(encoder.encode(": connected\n\n"));
      heartbeat = setInterval(() => controller?.enqueue(encoder.encode(": keep-alive\n\n")), 15_000);
      request.signal.addEventListener("abort", close, { once: true });
    },
    cancel: close,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
