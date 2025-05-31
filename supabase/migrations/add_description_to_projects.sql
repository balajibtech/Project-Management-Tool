/*
  # Add description column to projects table
  1. New Columns
    - `projects`
      - `description` (text, default '')
  2. Important Notes
    - This migration explicitly adds the `description` column to the `projects` table.
    - It uses `IF NOT EXISTS` to ensure idempotency and prevent errors if the column was already added by a previous, un-cached migration.
*/
DO $$
BEGIN
  -- Add 'description' column to 'projects' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'description'
  ) THEN
    ALTER TABLE projects ADD COLUMN description text DEFAULT '';
  END IF;
END $$;