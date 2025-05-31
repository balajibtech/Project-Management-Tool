/*
  # Re-add foreign key constraint for tasks.assigned_to
  1. Modified Tables
    - `tasks`
      - Added foreign key constraint `tasks_assigned_to_fkey` linking `tasks.assigned_to` to `resources.id`.
  2. Important Notes
    - This migration ensures the foreign key relationship between `tasks` and `resources` is explicitly defined.
    - It uses a conditional check to prevent errors if the constraint was already added.
    - This migration should run after `add_assigned_to_column_to_tasks.sql`.
*/
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_assigned_to_fkey'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES resources(id) ON DELETE SET NULL;
  END IF;
END $$;