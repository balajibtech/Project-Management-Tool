/*
  # Add estimated_effort column to tasks table
  1. Modified Tables
    - `tasks`
      - Adds `estimated_effort` (numeric, not null, default 0) if it doesn't exist.
  2. Important Notes
    - This migration ensures the `estimated_effort` column is present in the `tasks` table, addressing schema cache issues.
    - The operation is idempotent, meaning it can be run multiple times without causing errors.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'estimated_effort'
  ) THEN
    ALTER TABLE tasks ADD COLUMN estimated_effort numeric NOT NULL DEFAULT 0;
  END IF;
END $$;