"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  BusFront,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Gamepad2,
  Gift,
  HeartPulse,
  House,
  Plus,
  RotateCcw,
  ShoppingBag,
  Trash2,
  Utensils,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { createEntry, deleteEntry, updateEntry } from "@/app/[id]/actions";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getSeoulToday,
  type Category,
  type Entry,
  type EntryDraft,
  type EntryKind,
  type MonthSummary,
} from "@/lib/ledger";

const ICONS: Record<Category, LucideIcon> = {
  salary: Banknote,
  allowance: Gift,
  refund: RotateCcw,
  food: Utensils,
  transport: BusFront,
  shopping: ShoppingBag,
  housing: House,
  health: HeartPulse,
  leisure: Gamepad2,
  other: CircleEllipsis,
};

const CATEGORY_LABELS = Object.fromEntries(
  [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((category) => [category.value, category.label]),
) as Record<Category, string>;

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatWon(amount: number) {
  return `${numberFormatter.format(Math.abs(amount))}원`;
}

function dateHeading(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  const day = new Intl.DateTimeFormat("ko-KR", { day: "numeric", weekday: "long", timeZone: "UTC" }).format(parsed);
  return day.replace("일 ", "일 · ");
}

function initialDate(month: string) {
  const today = getSeoulToday();
  if (today.startsWith(month)) return today;
  const [, monthValue] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), monthValue, 0)).getUTCDate();
  return `${month}-${String(Math.min(Number(today.slice(8, 10)), lastDay)).padStart(2, "0")}`;
}

function emptyDraft(month: string): EntryDraft {
  return { kind: "expense", category: "food", amount: "", entryDate: initialDate(month), title: "", memo: "" };
}

function draftFromEntry(entry: Entry): EntryDraft {
  return {
    kind: entry.kind,
    category: entry.category,
    amount: String(entry.amount),
    entryDate: entry.entryDate,
    title: entry.title,
    memo: entry.memo ?? "",
  };
}

type Props = {
  ledgerId: string;
  month: string;
  previousMonth: string;
  nextMonth: string;
  entries: Entry[];
  summary: MonthSummary;
};

export function LedgerView({ ledgerId, month, previousMonth, nextMonth, entries, summary }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const monthDialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [draft, setDraft] = useState<EntryDraft>(() => emptyDraft(month));
  const [pickerYear, setPickerYear] = useState(Number(month.slice(0, 4)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const groups = useMemo(() => {
    const result = new Map<string, Entry[]>();
    for (const entry of entries) result.set(entry.entryDate, [...(result.get(entry.entryDate) ?? []), entry]);
    return [...result.entries()];
  }, [entries]);

  const [year, monthNumber] = month.split("-");
  const currentMonth = getSeoulToday().slice(0, 7);
  const categories = draft.kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function openEditor(entry?: Entry) {
    setEditing(entry ?? null);
    setDraft(entry ? draftFromEntry(entry) : emptyDraft(month));
    setError("");
    dialogRef.current?.showModal();
  }

  function openMonthPicker() {
    setPickerYear(Number(year));
    monthDialogRef.current?.showModal();
  }

  function chooseMonth(value: string) {
    monthDialogRef.current?.close();
    router.push(`/${ledgerId}?month=${value}`);
  }

  function closeEditor() {
    if (!submitting) dialogRef.current?.close();
  }

  function changeKind(kind: EntryKind) {
    setDraft((current) => ({
      ...current,
      kind,
      category: kind === "income" ? "salary" : "food",
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const result = editing
      ? await updateEntry(ledgerId, editing.id, draft)
      : await createEntry(ledgerId, draft);
    setSubmitting(false);
    if (!result.ok) return setError(result.message);
    dialogRef.current?.close();
    router.refresh();
  }

  async function removeEntry() {
    if (!editing || submitting || !window.confirm("이 거래를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")) return;
    setSubmitting(true);
    setError("");
    const result = await deleteEntry(ledgerId, editing.id);
    setSubmitting(false);
    if (!result.ok) return setError(result.message);
    dialogRef.current?.close();
    router.refresh();
  }

  return (
    <main className="ledger-shell">
      <header className="month-header">
        <Link className="icon-button" href={`/${ledgerId}?month=${previousMonth}`} aria-label="이전 달">
          <ChevronLeft />
        </Link>
        <div className="month-title" aria-live="polite">
          <strong>{Number(monthNumber)}월</strong>
        </div>
        <Link className="icon-button" href={`/${ledgerId}?month=${nextMonth}`} aria-label="다음 달">
          <ChevronRight />
        </Link>
        <button className="month-picker" type="button" aria-label="월 선택" aria-haspopup="dialog" onClick={openMonthPicker}>
          <CalendarDays aria-hidden="true" />
        </button>
      </header>

      <section className="summary" aria-label={`${Number(monthNumber)}월 요약`}>
        <div className="balance-card">
          <div className="balance-copy">
            <span>이번 달 남은 돈</span>
            <strong className={summary.balance < 0 ? "negative" : ""}>{summary.balance < 0 ? "−" : ""}{formatWon(summary.balance)}</strong>
          </div>
        </div>
        <div className="summary-grid">
          <div><span>이월금</span><strong>{formatWon(summary.carryover)}</strong></div>
          <div className="income"><span>수입</span><strong>+{formatWon(summary.income)}</strong></div>
          <div className="expense"><span>지출</span><strong>−{formatWon(summary.expense)}</strong></div>
        </div>
      </section>

      <section className="entries" aria-label="거래 내역">
        <div className="section-heading">
          <h1>거래 내역</h1>
          <span>{entries.length}건</span>
        </div>

        {groups.length ? groups.map(([date, dateEntries]) => (
          <section className="date-group" key={date}>
            <h2>{dateHeading(date)}</h2>
            <div className="entry-list">
              {dateEntries.map((entry) => {
                const Icon = ICONS[entry.category];
                return (
                  <button className="entry-row" type="button" key={entry.id} onClick={() => openEditor(entry)} aria-label={`${entry.title} ${formatWon(entry.amount)} 수정`}>
                    <span className={`category-icon ${entry.category}`} aria-hidden="true"><Icon /></span>
                    <span className="entry-copy">
                      <strong>{entry.title}</strong>
                      <small>{CATEGORY_LABELS[entry.category]}{entry.memo ? ` · ${entry.memo}` : ""}</small>
                    </span>
                    <strong className={`entry-amount ${entry.kind}`}>
                      {entry.kind === "income" ? "+" : "−"}{formatWon(entry.amount)}
                    </strong>
                  </button>
                );
              })}
            </div>
          </section>
        )) : (
          <div className="empty-state">
            <span aria-hidden="true"><WalletCards /></span>
            <h2>아직 거래가 없어요</h2>
            <p>오른쪽 아래 + 버튼을 눌러<br />첫 수입이나 지출을 기록해 보세요.</p>
          </div>
        )}
      </section>

      <button className="fab" type="button" onClick={() => openEditor()} aria-label="거래 등록">
        <Plus />
      </button>

      <dialog
        className="month-dialog"
        ref={monthDialogRef}
        aria-label="월 선택"
        onClick={(event) => event.target === event.currentTarget && monthDialogRef.current?.close()}
      >
        <section className="month-sheet">
          <div className="sheet-handle" aria-hidden="true" />
          <div className="month-sheet-header">
            <h2>월 선택</h2>
            <button className="icon-button subtle" type="button" onClick={() => monthDialogRef.current?.close()} aria-label="닫기"><X /></button>
          </div>
          <div className="year-selector">
            <button className="icon-button" type="button" onClick={() => setPickerYear((value) => Math.max(1900, value - 1))} disabled={pickerYear === 1900} aria-label="이전 연도"><ChevronLeft /></button>
            <strong>{pickerYear}년</strong>
            <button className="icon-button" type="button" onClick={() => setPickerYear((value) => Math.min(2100, value + 1))} disabled={pickerYear === 2100} aria-label="다음 연도"><ChevronRight /></button>
          </div>
          <div className="month-grid">
            {Array.from({ length: 12 }, (_, index) => {
              const value = `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
              return (
                <button className={value === month ? "selected" : ""} type="button" key={value} onClick={() => chooseMonth(value)} aria-current={value === month ? "date" : undefined}>
                  {index + 1}월
                </button>
              );
            })}
          </div>
          <button className="current-month-button" type="button" onClick={() => chooseMonth(currentMonth)}>이번 달로 이동</button>
        </section>
      </dialog>

      <dialog
        className="entry-dialog"
        ref={dialogRef}
        onClose={() => { setError(""); setEditing(null); }}
        onClick={(event) => event.target === event.currentTarget && closeEditor()}
      >
        <form className="entry-form" onSubmit={submit}>
          <div className="sheet-handle" aria-hidden="true" />
          <div className="form-header">
            <h2>{editing ? "거래 수정" : "거래 등록"}</h2>
            <button className="icon-button subtle" type="button" onClick={closeEditor} disabled={submitting} aria-label="닫기"><X /></button>
          </div>

          <fieldset className="kind-selector">
            <legend className="sr-only">거래 유형</legend>
            {(["expense", "income"] as const).map((kind) => (
              <label key={kind} className={draft.kind === kind ? "selected" : ""}>
                <input type="radio" name="kind" checked={draft.kind === kind} onChange={() => changeKind(kind)} />
                {kind === "expense" ? "지출" : "수입"}
              </label>
            ))}
          </fieldset>

          <label className="field amount-field">
            <span>금액</span>
            <div><input autoFocus inputMode="numeric" pattern="[0-9]*" placeholder="0" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} required /><b>원</b></div>
          </label>

          <div className="field">
            <span>카테고리</span>
            <div className="category-grid">
              {categories.map((category) => {
                const Icon = ICONS[category.value];
                return (
                  <label key={category.value} className={draft.category === category.value ? "selected" : ""}>
                    <input type="radio" name="category" checked={draft.category === category.value} onChange={() => setDraft({ ...draft, category: category.value })} />
                    <Icon aria-hidden="true" />
                    <span>{category.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="field-row">
            <label className="field"><span>날짜</span><input type="date" min="1900-01-01" max="2100-12-31" value={draft.entryDate} onChange={(event) => setDraft({ ...draft, entryDate: event.target.value })} required /></label>
            <label className="field grow"><span>내용</span><input type="text" maxLength={100} placeholder="예: 점심 식사" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
          </div>

          <label className="field"><span>메모 <small>선택</small></span><textarea maxLength={500} rows={2} placeholder="기억해 둘 내용을 입력하세요" value={draft.memo} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} /></label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="form-actions">
            {editing && <button className="delete-button" type="button" onClick={removeEntry} disabled={submitting}><Trash2 /> 삭제</button>}
            <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "저장 중…" : editing ? "변경사항 저장" : "거래 등록"}</button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
