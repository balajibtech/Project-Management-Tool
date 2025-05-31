/*
  # Add assigned_to column to tasks table
  1. Modified Tables
    - `tasks`
      - Added `assigned_to` (uuid, nullable)
  2. Important Notes
    - This migration ensures the `assigned_to` column exists in the `tasks` table.
    - It uses a conditional check to prevent errors if the column was already added.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_to uuid;
  END IF;
END $$;