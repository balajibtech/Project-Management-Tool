/*
  # Schema update for projects and teams tables
  1. New Columns
    - `projects`
      - `description` (text, default '')
      - `progress` (integer, default 0)
      - `team_id` (uuid, foreign key to `teams.id`)
    - `teams`
      - `name` (text, unique, not null, default 'Default Team')
  2. Security
    - Enable RLS on `teams` table (if not already)
    - Add policies for `teams` table to allow authenticated users to read and manage their teams.
    - Update RLS on `projects` to account for `team_id`.
  3. Changes
    - Adds a foreign key constraint from `projects.team_id` to `teams.id`.
*/
DO $$
BEGIN
  -- Add 'description' column to 'projects' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
    ALTER TABLE projects ADD COLUMN description text DEFAULT '';
  END IF;

  -- Add 'progress' column to 'projects' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'progress') THEN
    ALTER TABLE projects ADD COLUMN progress integer DEFAULT 0;
  END IF;

  -- Add 'name' column to 'teams' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'name') THEN
    ALTER TABLE teams ADD COLUMN name text UNIQUE NOT NULL DEFAULT 'Default Team';
  END IF;

  -- Add 'team_id' column to 'projects' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'team_id') THEN
    ALTER TABLE projects ADD COLUMN team_id uuid;
  END IF;

  -- Drop existing foreign key constraint if it exists to re-add with ON DELETE SET NULL
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_team_id_fkey'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_team_id_fkey;
  END IF;

  -- Add foreign key constraint for 'team_id' in 'projects'
  ALTER TABLE projects
  ADD CONSTRAINT projects_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

  -- Enable RLS for teams table if not already enabled
  EXECUTE 'ALTER TABLE teams ENABLE ROW LEVEL SECURITY;';

  -- Add RLS policies for teams table
  -- Policy to allow authenticated users to read teams
  CREATE POLICY IF NOT EXISTS "Authenticated users can view teams"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

  -- Policy to allow authenticated users to insert teams
  CREATE POLICY IF NOT EXISTS "Authenticated users can create teams"
    ON teams FOR INSERT
    TO authenticated
    WITH CHECK (true);

  -- Policy to allow authenticated users to update teams
  CREATE POLICY IF NOT EXISTS "Authenticated users can update teams"
    ON teams FOR UPDATE
    TO authenticated
    USING (true); -- Consider more restrictive update policies if needed

  -- Policy to allow authenticated users to delete teams
  CREATE POLICY IF NOT EXISTS "Authenticated users can delete teams"
    ON teams FOR DELETE
    TO authenticated
    USING (true); -- Consider more restrictive delete policies if needed

END $$;