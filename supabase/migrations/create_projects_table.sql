/*
  # Create projects table
  1. New Tables
    - `projects`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (text, not null, default '')
      - `description` (text, default '')
      - `start_date` (date, not null, default now())
      - `end_date` (date, not null, default now())
      - `status` (text, not null, default 'Not Started')
      - `priority` (text, not null, default 'Medium')
      - `owner_id` (uuid, foreign key to resources.id, nullable)
      - `planned_budget` (numeric, not null, default 0)
      - `actual_budget` (numeric, not null, default 0)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `projects` table
    - Add policy for authenticated users to read all projects
    - Add policy for authenticated users to create, update, delete their own projects (or projects they own)
*/
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  start_date date NOT NULL DEFAULT now(),
  end_date date NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Not Started',
  priority text NOT NULL DEFAULT 'Medium',
  owner_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  planned_budget numeric NOT NULL DEFAULT 0,
  actual_budget numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all projects
CREATE POLICY "Allow authenticated users to read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create projects
CREATE POLICY "Allow authenticated users to create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update projects they own
CREATE POLICY "Allow authenticated users to update projects they own"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers')); -- Example: assuming a 'Project Managers' team

-- Allow authenticated users to delete projects they own
CREATE POLICY "Allow authenticated users to delete projects they own"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));