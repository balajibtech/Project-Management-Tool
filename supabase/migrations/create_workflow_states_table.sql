/*
  # Create workflow_states table
  1. New Tables
    - `workflow_states`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (text, not null, unique, default '')
      - `description` (text, default '')
      - `order_index` (integer, not null, default 0)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `workflow_states` table
    - Add policy for authenticated users to read all workflow states
    - Add policy for Project Managers to create, update, and delete workflow states
*/
CREATE TABLE IF NOT EXISTS workflow_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE DEFAULT '',
  description text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all workflow states
CREATE POLICY "Allow authenticated users to read workflow states"
  ON workflow_states
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow Project Managers to create workflow states
CREATE POLICY "Allow Project Managers to create workflow states"
  ON workflow_states
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow Project Managers to update workflow states
CREATE POLICY "Allow Project Managers to update workflow states"
  ON workflow_states
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow Project Managers to delete workflow states
CREATE POLICY "Allow Project Managers to delete workflow states"
  ON workflow_states
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));