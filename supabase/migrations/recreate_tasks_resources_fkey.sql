/*
  # Recreate foreign key constraint for tasks.assigned_to to resources.id
  1. Modified Tables
    - `tasks`
      - Ensures the `assigned_to` column exists.
      - Drops the existing foreign key constraint `tasks_assigned_to_fkey` if it exists.
      - Re-adds the foreign key constraint `tasks_assigned_to_fkey` linking `tasks.assigned_to` to `resources.id` with `ON DELETE SET NULL`.
  2. Important Notes
    - This migration is designed to robustly establish the foreign key relationship, addressing persistent schema cache issues.
    - It is idempotent and will not cause errors if the column or constraint state is different than expected.
*/
DO $$
BEGIN
  -- Ensure the assigned_to column exists before attempting to add/re-add FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_to uuid;
  END IF;

  -- Drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_assigned_to_fkey'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_to_fkey;
  END IF;

  -- Add the foreign key constraint
  ALTER TABLE tasks
  ADD CONSTRAINT tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES resources(id) ON DELETE SET NULL;
END $$;