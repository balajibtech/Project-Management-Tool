/*
  # Ensure projects_team_id_fkey integrity
  1. Changes
    - Drops and re-adds the foreign key constraint from `projects.team_id` to `teams.id`.
  2. Important Notes
    - This migration is a further attempt to force Supabase's schema cache to recognize the relationship between `projects` and `teams`, addressing a persistent caching issue.
    - It ensures the `team_id` column exists as `uuid` before re-adding the foreign key.
*/
DO $$
BEGIN
  -- Drop existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_team_id_fkey'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_team_id_fkey;
  END IF;

  -- Ensure 'team_id' column exists in 'projects' and is of type uuid
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'team_id') THEN
    ALTER TABLE projects ADD COLUMN team_id uuid;
  END IF;

  -- Add foreign key constraint for 'team_id' in 'projects'
  ALTER TABLE projects
  ADD CONSTRAINT projects_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

END $$;