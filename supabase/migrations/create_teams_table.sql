/*
  # Create teams table
  1. New Tables
    - `teams`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (text, not null, unique, default '')
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `teams` table
    - Add policy for authenticated users to read all teams
    - Add policy for authenticated users to create, update, delete teams (e.g., only admins or project managers)
*/
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all teams
CREATE POLICY "Allow authenticated users to read all teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create teams (e.g., only if they are a Project Manager)
CREATE POLICY "Allow authenticated users to create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow authenticated users to update teams (e.g., only if they are a Project Manager)
CREATE POLICY "Allow authenticated users to update teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow authenticated users to delete teams (e.g., only if they are a Project Manager)
CREATE POLICY "Allow authenticated users to delete teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));