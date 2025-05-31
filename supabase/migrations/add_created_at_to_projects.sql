/*
  # Add created_at column to projects table
  1. Modified Tables
    - `projects`
      - Added `created_at` (timestamptz, default now()) column.
  2. Important Notes
    - This migration ensures the `created_at` column exists in the `projects` table.
    - It uses a conditional check to prevent errors if the column was already added.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;