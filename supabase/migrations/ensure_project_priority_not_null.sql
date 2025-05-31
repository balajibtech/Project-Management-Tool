/*
      # Ensure projects.priority is NOT NULL with a default value
      1. Modified Tables
        - `projects`
          - Updates existing `priority` values from `NULL` to `'Medium'`.
          - Alters the `priority` column to be `NOT NULL` with a `DEFAULT 'Medium'`.
      2. Important Notes
        - This migration ensures data consistency for the `priority` column, preventing future `NULL` values.
        - All operations are idempotent.
    */
    DO $$
    BEGIN
      -- Update existing NULL priority values to 'Medium'
      UPDATE projects
      SET priority = 'Medium'
      WHERE priority IS NULL;

      -- Alter column to set NOT NULL and add a default if not already set
      -- Check if the column is nullable before attempting to set NOT NULL
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'projects'
        AND column_name = 'priority'
        AND is_nullable = 'YES'
      ) THEN
        ALTER TABLE projects ALTER COLUMN priority SET NOT NULL;
      END IF;

      -- Add default value if it doesn't exist. This is safe to run multiple times.
      ALTER TABLE projects ALTER COLUMN priority SET DEFAULT 'Medium';

    END $$;