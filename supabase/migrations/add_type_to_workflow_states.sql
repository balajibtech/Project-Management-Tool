/*
  # Add 'type' column to workflow_states table
  1. Modified Tables
    - `workflow_states`
      - Added `type` (text, not null, default '')
  2. Important Notes
    - This column is added to categorize workflow states, e.g., 'initial', 'standard', 'final'.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_states' AND column_name = 'type'
  ) THEN
    ALTER TABLE workflow_states ADD COLUMN type text NOT NULL DEFAULT '';
  END IF;
END $$;