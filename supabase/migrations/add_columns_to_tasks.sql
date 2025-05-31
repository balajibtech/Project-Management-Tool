/*
  # Schema update for tasks table
  1. New Columns
    - `tasks`
      - `description` (text, default '')
      - `progress` (integer, default 0)
  2. Security
    - Update RLS on `tasks` table to account for new columns.
*/
DO $$
BEGIN
  -- Add 'description' column to 'tasks' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'description') THEN
    ALTER TABLE tasks ADD COLUMN description text DEFAULT '';
  END IF;

  -- Add 'progress' column to 'tasks' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'progress') THEN
    ALTER TABLE tasks ADD COLUMN progress integer DEFAULT 0;
  END IF;
END $$;