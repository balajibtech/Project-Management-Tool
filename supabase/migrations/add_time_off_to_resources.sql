/*
      # Schema update for resources table
      1. New Columns
        - `resources`
          - `time_off` (text, not null, default '')
      2. Important Notes
        - Adds the `time_off` column to the `resources` table.
        - Sets default to `''` to ensure data integrity and prevent nulls.
        - This migration is idempotent, ensuring it only adds the column if it doesn't already exist.
    */
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'resources' AND column_name = 'time_off'
      ) THEN
        ALTER TABLE resources ADD COLUMN time_off text NOT NULL DEFAULT '';
      END IF;
    END $$;