/*
  # Create team_members table
  1. New Tables
    - `team_members`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `resource_id` (uuid, foreign key to resources.id, not null)
      - `team_id` (uuid, foreign key to teams.id, not null)
      - `role_in_team` (text, not null, default '')
      - `created_at` (timestamptz, default now())
  2. Constraints
    - Unique constraint on `(resource_id, team_id)` to prevent duplicate team assignments.
  3. Security
    - Enable RLS on `team_members` table
    - Add policy for authenticated users to read team members if they are part of the team or a Project Manager
    - Add policy for Project Managers to create, update, and delete team members
*/
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role_in_team text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (resource_id, team_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read team members if they are part of the team or a Project Manager
CREATE POLICY "Allow authenticated users to read team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = resource_id OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow Project Managers to create team members
CREATE POLICY "Allow Project Managers to create team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow Project Managers to update team members
CREATE POLICY "Allow Project Managers to update team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow Project Managers to delete team members
CREATE POLICY "Allow Project Managers to delete team members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));