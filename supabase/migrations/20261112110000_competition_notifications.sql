-- Hubnovo World notifications use type 'competition' and category 'competition'
-- (title/body/data carry the message). notifications.type / .category may be
-- enums or plain text depending on the project's history: add the value only
-- where the column is an enum. Kept on its own: a new enum value can't be used
-- in the same transaction that adds it.
DO $$
DECLARE
  v_col  text;
  v_type regtype;
BEGIN
  FOREACH v_col IN ARRAY ARRAY['type', 'category'] LOOP
    SELECT a.atttypid::regtype INTO v_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'notifications' AND a.attname = v_col AND NOT a.attisdropped;

    IF v_type IS NOT NULL AND EXISTS (SELECT 1 FROM pg_type WHERE oid = v_type AND typtype = 'e') THEN
      EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', v_type, 'competition');
    END IF;
  END LOOP;
END $$;

-- Report (for the person running this): column types and any CHECK constraints.
SELECT 'column ' || a.attname AS item, a.atttypid::regtype::text AS detail
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'notifications' AND a.attname IN ('type', 'category')
UNION ALL
SELECT 'check ' || conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.notifications'::regclass AND contype = 'c';
