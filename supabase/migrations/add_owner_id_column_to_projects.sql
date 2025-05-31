/*
  # Add owner_id column to projects table
  1. Modified Tables
    - `projects`
      - Added `owner_id` (uuid, nullable) column.
  2. Important Notes
    - This migration ensures the `owner_id` column exists in the `projects` table before any foreign key constraints are applied.
    - It uses a conditional check to prevent errors if the column was already added.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN owner_id uuid;
  END IF;
END $$;