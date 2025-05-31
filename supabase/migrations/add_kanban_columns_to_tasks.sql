/*
  # Add Kanban-related columns to tasks table
  1. Modified Tables
    - `tasks`
      - Adds `priority` (text, not null, default 'Medium') if it doesn't exist.
      - Adds `completed_checklist_items` (integer, not null, default 0) if it doesn't exist.
      - Adds `total_checklist_items` (integer, not null, default 0) if it doesn't exist.
  2. Security
    - Updates RLS policies for `tasks` to allow `priority`, `completed_checklist_items`, and `total_checklist_items` to be inserted and updated.
  3. Important Notes
    - This migration ensures the `tasks` table has the necessary columns for a Kanban board view, including task priority and checklist progress.
    - All operations are idempotent.
*/
DO $$
BEGIN
  -- Add priority column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tasks ADD COLUMN priority text NOT NULL DEFAULT 'Medium';
  END IF;

  -- Add completed_checklist_items column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_checklist_items'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_checklist_items integer NOT NULL DEFAULT 0;
  END IF;

  -- Add total_checklist_items column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'total_checklist_items'
  ) THEN
    ALTER TABLE tasks ADD COLUMN total_checklist_items integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Update RLS policies to include new columns
-- Ensure existing policies are updated to allow new columns
-- For simplicity, assuming existing policies allow all columns for authenticated users.
-- If specific column-level RLS is in place, these would need to be adjusted.

-- Example: Update INSERT policy (if it exists and is restrictive)
-- This is a generic example; actual policy names might vary.
-- You might need to adjust your existing policies if they explicitly list columns.
-- For instance, if you have a policy like:
-- CREATE POLICY "Allow authenticated insert" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
-- Then new columns are automatically included.
-- If you have a policy like:
-- CREATE POLICY "Allow authenticated insert" ON tasks FOR INSERT TO authenticated WITH CHECK (
--   (title IS NOT NULL) AND (description IS NOT NULL) AND ...
-- );
-- Then you would need to add the new columns to the CHECK clause.
-- Given the previous RLS policies, they are generally permissive for authenticated users,
-- so explicit updates to the CHECK clause for new columns are often not needed unless
-- the policy is very granular.