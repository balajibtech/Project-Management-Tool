/*
      # Schema update for resources table
      1. New Columns
        - `resources`
          - `weekly_capacity` (numeric, not null, default 40)
      2. Important Notes
        - Adds the `weekly_capacity` column to the `resources` table.
        - Uses `numeric` type for precise capacity values.
        - Sets default to `40` (for a standard 40-hour work week) to ensure data integrity and prevent nulls.
        - This migration is idempotent, ensuring it only adds the column if it doesn't already exist.
    */
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'resources' AND column_name = 'weekly_capacity'
      ) THEN
        ALTER TABLE resources ADD COLUMN weekly_capacity numeric NOT NULL DEFAULT 40;
      END IF;
    END $$;