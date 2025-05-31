/*
  # Recreate projects_team_id_fkey
  1. Changes
    - Drops and re-adds the foreign key constraint from `projects.team_id` to `teams.id`.
  2. Important Notes
    - This migration is intended to force Supabase's schema cache to recognize the relationship between `projects` and `teams`.
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

  -- Add foreign key constraint for 'team_id' in 'projects'
  -- Ensure the column exists before adding the FK (though it should from previous migrations)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'team_id') THEN
    ALTER TABLE projects ADD COLUMN team_id uuid;
  END IF;

  ALTER TABLE projects
  ADD CONSTRAINT projects_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

END $$;