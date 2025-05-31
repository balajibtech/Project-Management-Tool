/*
  # Create workflow_transitions table
  1. New Tables
    - `workflow_transitions`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (text, not null, default '')
      - `description` (text, default '')
      - `from_state_id` (uuid, foreign key to workflow_states.id, not null)
      - `to_state_id` (uuid, foreign key to workflow_states.id, not null)
      - `created_at` (timestamptz, default now())
  2. Constraints
    - Unique constraint on `(from_state_id, to_state_id)` to prevent duplicate transitions between the same states.
  3. Security
    - Enable RLS on `workflow_transitions` table
    - Add policy for authenticated users to read all workflow transitions
    - Add policy for Project Managers to create, update, and delete workflow transitions
*/
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  from_state_id uuid NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  to_state_id uuid NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (from_state_id, to_state_id)
);

ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all workflow transitions
CREATE POLICY "Allow authenticated users to read workflow transitions"
  ON workflow_transitions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow Project Managers to create workflow transitions
CREATE POLICY "Allow Project Managers to create workflow transitions"
  ON workflow_transitions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow Project Managers to update workflow transitions
CREATE POLICY "Allow Project Managers to update workflow transitions"
  ON workflow_transitions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));

-- Allow Project Managers to delete workflow transitions
CREATE POLICY "Allow Project Managers to delete workflow transitions"
  ON workflow_transitions
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'));