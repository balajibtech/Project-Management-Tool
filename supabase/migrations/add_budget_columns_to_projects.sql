/*
      # Schema update for projects table
      1. New Columns
        - `projects`
          - `planned_budget` (numeric, default 0)
          - `actual_budget` (numeric, default 0)
      2. Important Notes
        - Adds budget columns to the projects table.
        - Uses `numeric` type for precise financial values.
        - Sets default to `0` to ensure data integrity.
    */
    DO $$
    BEGIN
      -- Add 'planned_budget' column to 'projects' if it doesn't exist
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'planned_budget') THEN
        ALTER TABLE projects ADD COLUMN planned_budget numeric DEFAULT 0;
      END IF;

      -- Add 'actual_budget' column to 'projects' if it doesn't exist
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'actual_budget') THEN
        ALTER TABLE projects ADD COLUMN actual_budget numeric DEFAULT 0;
      END IF;
    END $$;