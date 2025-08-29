-- Add location column to jobs table
-- This script is for manual database migration if needed
-- The application is configured with spring.jpa.hibernate.ddl-auto=update
-- so this change will be applied automatically when the application starts

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(500);

-- Add comment to the column
COMMENT ON COLUMN jobs.location IS 'Job location information (address, coordinates, etc.)';
