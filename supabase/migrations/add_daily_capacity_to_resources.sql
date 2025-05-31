/*
      # Schema update for resources table
      1. New Columns
        - `resources`
          - `daily_capacity` (numeric, not null, default 8)
      2. Important Notes
        - Adds the `daily_capacity` column to the `resources` table.
        - Uses `numeric` type for precise capacity values.
        - Sets default to `8` to ensure data integrity and prevent nulls.
        - This migration is idempotent, ensuring it only adds the column if it doesn't already exist.
    */
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'resources' AND column_name = 'daily_capacity'
      ) THEN
        ALTER TABLE resources ADD COLUMN daily_capacity numeric NOT NULL DEFAULT 8;
      END IF;
    END $$;