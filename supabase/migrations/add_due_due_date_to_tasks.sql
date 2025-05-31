/*
  # Add due_date column to tasks table
  1. Modified Tables
    - `tasks`
      - Added `due_date` (date, not null, default now()) if it does not exist.
  2. Important Notes
    - This migration ensures the `due_date` column exists in the `tasks` table, addressing a potential schema inconsistency.
    - It uses a conditional check to prevent errors if the column was already added by a previous, partially applied migration.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_date date NOT NULL DEFAULT now();
  END IF;
END $$;