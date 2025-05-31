/*
  # Add owner_id foreign key to projects table
  1. Modified Tables
    - `projects`
      - Added a foreign key constraint on `owner_id` referencing `resources.id` if it does not already exist.
  2. Important Notes
    - This migration ensures the foreign key relationship between `projects.owner_id` and `resources.id` is correctly established.
    - It uses a conditional check to prevent errors if the constraint was already added by a previous migration.
*/
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'projects_owner_id_fkey'
    AND table_name = 'projects'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE projects
    ADD CONSTRAINT projects_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES resources(id) ON DELETE SET NULL;
  END IF;
END $$;