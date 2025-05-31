/*
  # Create resources table
  1. New Tables
    - `resources`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (text, not null, default '')
      - `role` (text, not null, default '')
      - `skills` (text[], default '{}')
      - `daily_capacity` (numeric, not null, default 8)
      - `weekly_capacity` (numeric, not null, default 40)
      - `time_off` (text, default '')
      - `allocation_percentage` (numeric, not null, default 0)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `resources` table
    - Add policy for authenticated users to read all resources
    - Add policy for authenticated users to create, update, delete resources (e.g., only admins or project managers)
*/
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  skills text[] DEFAULT '{}',
  daily_capacity numeric NOT NULL DEFAULT 8,
  weekly_capacity numeric NOT NULL DEFAULT 40,
  time_off text DEFAULT '',
  allocation_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all resources
CREATE POLICY "Allow authenticated users to read all resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create resources (e.g., only if they are a Project Manager)
CREATE POLICY "Allow authenticated users to create resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow authenticated users to update resources (e.g., only if they are a Project Manager or the resource themselves)
CREATE POLICY "Allow authenticated users to update resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow authenticated users to delete resources (e.g., only if they are a Project Manager)
CREATE POLICY "Allow authenticated users to delete resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));