CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY,
  ledger_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income', 'expense')),
  category text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0 AND amount <= 9007199254740991),
  entry_date date NOT NULL CHECK (entry_date BETWEEN DATE '1900-01-01' AND DATE '2100-12-31'),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  memo text CHECK (memo IS NULL OR char_length(memo) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_entries_category_matches_kind CHECK (
    (kind = 'income' AND category IN ('salary', 'allowance', 'refund', 'other')) OR
    (kind = 'expense' AND category IN ('food', 'transport', 'shopping', 'housing', 'health', 'leisure', 'other'))
  )
);

CREATE INDEX IF NOT EXISTS ledger_entries_ledger_date_idx
  ON ledger_entries (ledger_id, entry_date DESC, created_at DESC);
