/*
      # Ensure created_by column has default and FK, and update RLS
      1. Modified Tables
        - `projects`
          - Ensures `created_by` column has `DEFAULT auth.uid()`.
          - Adds foreign key constraint to `auth.users(id)`.
      2. Security
        - Updated RLS policy for `INSERT` on `projects` to enforce `created_by` is `auth.uid()`.
      3. Important Notes
        - This migration addresses the "null value violates not-null constraint" error by ensuring the database automatically populates `created_by` if not provided.
        - It also adds a foreign key to `auth.users` for data integrity.
        - The RLS policy update prevents users from impersonating other creators.
        - All operations are idempotent.
    */
    DO $$
    BEGIN
      -- Add created_by column if it doesn't exist (as nullable initially)
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'created_by'
      ) THEN
        ALTER TABLE projects ADD COLUMN created_by uuid;
      END IF;

      -- Ensure the column has a default value of auth.uid()
      -- This will add the default if it's not already present.
      -- It will not affect existing rows unless they are updated.
      -- This is safe even if the column is already NOT NULL.
      ALTER TABLE projects ALTER COLUMN created_by SET DEFAULT auth.uid();

      -- Add foreign key constraint to auth.users(id) if it doesn't exist
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'projects_created_by_fkey' AND conrelid = 'public.projects'::regclass
      ) THEN
        ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
      END IF;

      -- Recreate or update the INSERT policy to enforce created_by = auth.uid()
      -- Drop existing policy if it exists to ensure a clean update
      DROP POLICY IF EXISTS "Allow authenticated users to create projects" ON projects;

      CREATE POLICY "Allow authenticated users to create projects"
        ON projects
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = created_by);

    END $$;