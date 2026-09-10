"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isLedgerId, isUuid, validateEntryDraft, type EntryDraft } from "@/lib/ledger";
import { ledgerIdToUuid } from "@/lib/ledger-id";

export type ActionResult = { ok: true } | { ok: false; message: string };

function validateIds(ledgerId: string, entryId?: string): ActionResult | null {
  if (!isLedgerId(ledgerId)) return { ok: false, message: "가계부 ID가 올바르지 않습니다." };
  if (entryId && !isUuid(entryId)) return { ok: false, message: "거래 ID가 올바르지 않습니다." };
  return null;
}

export async function createEntry(ledgerId: string, input: EntryDraft): Promise<ActionResult> {
  const idError = validateIds(ledgerId);
  if (idError) return idError;
  const parsed = validateEntryDraft(input);
  if (!parsed.ok) return parsed;

  try {
    const sql = db();
    const internalLedgerId = ledgerIdToUuid(ledgerId);
    const value = parsed.value;
    await sql`
      INSERT INTO ledger_entries (id, ledger_id, kind, category, amount, entry_date, title, memo)
      VALUES (${crypto.randomUUID()}, ${internalLedgerId}, ${value.kind}, ${value.category}, ${value.amount}, ${value.entryDate}, ${value.title}, ${value.memo})
    `;
    revalidatePath(`/${ledgerId}`);
    return { ok: true };
  } catch (error) {
    console.error("Failed to create ledger entry", error);
    return { ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function updateEntry(ledgerId: string, entryId: string, input: EntryDraft): Promise<ActionResult> {
  const idError = validateIds(ledgerId, entryId);
  if (idError) return idError;
  const parsed = validateEntryDraft(input);
  if (!parsed.ok) return parsed;

  try {
    const sql = db();
    const internalLedgerId = ledgerIdToUuid(ledgerId);
    const value = parsed.value;
    const updated = await sql`
      UPDATE ledger_entries
      SET kind = ${value.kind}, category = ${value.category}, amount = ${value.amount},
          entry_date = ${value.entryDate}, title = ${value.title}, memo = ${value.memo}, updated_at = now()
      WHERE id = ${entryId} AND ledger_id = ${internalLedgerId}
      RETURNING id
    `;
    if (!updated.length) return { ok: false, message: "수정할 거래를 찾지 못했습니다." };
    revalidatePath(`/${ledgerId}`);
    return { ok: true };
  } catch (error) {
    console.error("Failed to update ledger entry", error);
    return { ok: false, message: "수정하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function deleteEntry(ledgerId: string, entryId: string): Promise<ActionResult> {
  const idError = validateIds(ledgerId, entryId);
  if (idError) return idError;

  try {
    const sql = db();
    const internalLedgerId = ledgerIdToUuid(ledgerId);
    const deleted = await sql`
      DELETE FROM ledger_entries WHERE id = ${entryId} AND ledger_id = ${internalLedgerId} RETURNING id
    `;
    if (!deleted.length) return { ok: false, message: "삭제할 거래를 찾지 못했습니다." };
    revalidatePath(`/${ledgerId}`);
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete ledger entry", error);
    return { ok: false, message: "삭제하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
