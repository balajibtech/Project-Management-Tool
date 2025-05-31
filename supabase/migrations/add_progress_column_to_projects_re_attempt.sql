/*
  # Re-add progress column to projects table
  1. New Columns
    - `projects`
      - `progress` (integer, default 0)
  2. Important Notes
    - This migration explicitly re-adds the `progress` column to the `projects` table.
    - It uses `IF NOT EXISTS` to ensure idempotency and prevent errors if the column was already added.
    - This is a re-attempt to resolve persistent schema cache issues where the column is not recognized.
*/
DO $$
BEGIN
  -- Add 'progress' column to 'projects' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'progress'
  ) THEN
    ALTER TABLE projects ADD COLUMN progress integer DEFAULT 0;
  END IF;
END $$;