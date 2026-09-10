ALTER TABLE ledger_entries
  DROP CONSTRAINT IF EXISTS ledger_entries_category_matches_kind;

UPDATE ledger_entries
SET category = CASE
  WHEN kind = 'income' AND category IN ('salary', 'allowance', 'regular_payment') THEN 'regular_payment'
  WHEN kind = 'income' AND category IN ('refund', 'special_payment') THEN 'special_payment'
  WHEN kind = 'income' THEN 'other'
  WHEN kind = 'expense' AND category IN ('food', 'meal') THEN 'meal'
  WHEN kind = 'expense' AND category = 'transport' THEN 'transport'
  WHEN kind = 'expense' AND category = 'cafe' THEN 'cafe'
  ELSE 'other'
END;

ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_entries_category_matches_kind CHECK (
    (kind = 'income' AND category IN ('regular_payment', 'special_payment', 'other')) OR
    (kind = 'expense' AND category IN ('meal', 'cafe', 'transport', 'other'))
  );

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
    gen_random_uuid(), id, 'income', 'regular_payment', 50000, seoul_month,
    '월 지급금', '매월 자동 지급', 'monthly-grant:' || to_char(seoul_month, 'YYYY-MM')
  FROM ledger_books
  WHERE target_ledger_id IS NULL OR id = target_ledger_id
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS granted_count = ROW_COUNT;
  RETURN granted_count;
END;
$$;
