/*
  # Create tasks table
  1. New Tables
    - `tasks`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `project_id` (uuid, foreign key to projects.id, not null)
      - `title` (text, not null, default '')
      - `description` (text, default '')
      - `estimated_effort` (numeric, not null, default 0)
      - `actual_effort` (numeric, not null, default 0)
      - `assigned_to` (uuid, foreign key to resources.id, nullable)
      - `due_date` (date, not null, default now())
      - `status` (text, not null, default 'To Do')
      - `predecessor_task_id` (uuid, foreign key to tasks.id, nullable, self-referencing)
      - `successor_task_id` (uuid, foreign key to tasks.id, nullable, self-referencing)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `tasks` table
    - Add policy for authenticated users to read tasks associated with projects they can view
    - Add policy for authenticated users to create, update, delete tasks within projects they can manage
*/
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  estimated_effort numeric NOT NULL DEFAULT 0,
  actual_effort numeric NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES resources(id) ON DELETE SET NULL,
  due_date date NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'To Do',
  predecessor_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  successor_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read tasks if they can read the associated project
CREATE POLICY "Allow authenticated users to read tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id));

-- Allow authenticated users to create tasks if they can manage the associated project
CREATE POLICY "Allow authenticated users to create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND (auth.uid() = projects.owner_id OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'))));

-- Allow authenticated users to update tasks if they can manage the associated project or are assigned to the task
CREATE POLICY "Allow authenticated users to update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND (auth.uid() = projects.owner_id OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'))) OR auth.uid() = assigned_to);

-- Allow authenticated users to delete tasks if they can manage the associated project
CREATE POLICY "Allow authenticated users to delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND (auth.uid() = projects.owner_id OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.resource_id = auth.uid() AND t.name = 'Project Managers'))));