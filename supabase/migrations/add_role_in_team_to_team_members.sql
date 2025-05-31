/*
  # Add 'role_in_team' column to team_members table
  1. Modified Tables
    - `team_members`
      - Added `role_in_team` (text, not null, default '')
  2. Important Notes
    - This column is added to define the specific role of a resource within a team.
    - This migration ensures the column exists, addressing previous errors.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'role_in_team'
  ) THEN
    ALTER TABLE team_members ADD COLUMN role_in_team text NOT NULL DEFAULT '';
  END IF;
END $$;