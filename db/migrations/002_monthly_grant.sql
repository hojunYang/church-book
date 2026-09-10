CREATE TABLE IF NOT EXISTS ledger_books (
  id uuid PRIMARY KEY,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_books_slug_format CHECK (
    slug IS NULL OR slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
  )
);

INSERT INTO ledger_books (id)
SELECT DISTINCT ledger_id FROM ledger_entries
ON CONFLICT (id) DO NOTHING;

ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS entry_key text;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_ledger_key_idx
  ON ledger_entries (ledger_id, entry_key)
  WHERE entry_key IS NOT NULL;

CREATE OR REPLACE FUNCTION grant_monthly_allowance(target_ledger_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  granted_count integer;
  seoul_month date := date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date;
BEGIN
  INSERT INTO ledger_entries (
    id, ledger_id, kind, category, amount, entry_date, title, memo, entry_key
  )
  SELECT
    gen_random_uuid(), id, 'income', 'allowance', 50000, seoul_month,
    '월 지급금', '매월 자동 지급', 'monthly-grant:' || to_char(seoul_month, 'YYYY-MM')
  FROM ledger_books
  WHERE target_ledger_id IS NULL OR id = target_ledger_id
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS granted_count = ROW_COUNT;
  RETURN granted_count;
END;
$$;

CREATE OR REPLACE FUNCTION notify_ledger_entry_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('ledger_changes', COALESCE(NEW.ledger_id, OLD.ledger_id)::text);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'ledger_entries_notify_change'
      AND tgrelid = 'ledger_entries'::regclass
  ) THEN
    CREATE TRIGGER ledger_entries_notify_change
      AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
      FOR EACH ROW EXECUTE FUNCTION notify_ledger_entry_change();
  END IF;
END;
$$;
