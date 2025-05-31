/*
      # Schema update for resources table
      1. New Columns
        - `resources`
          - `allocation_percentage` (numeric, not null, default 0)
      2. Important Notes
        - Adds the `allocation_percentage` column to the `resources` table.
        - Uses `numeric` type for precise percentage values.
        - Sets default to `0` to ensure data integrity and prevent nulls.
        - This migration is idempotent, ensuring it only adds the column if it doesn't already exist.
    */
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'resources' AND column_name = 'allocation_percentage'
      ) THEN
        ALTER TABLE resources ADD COLUMN allocation_percentage numeric NOT NULL DEFAULT 0;
      END IF;
    END $$;