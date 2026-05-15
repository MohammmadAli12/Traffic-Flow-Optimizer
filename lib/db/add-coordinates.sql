-- Add coordinates column to roads table if it doesn't exist
ALTER TABLE roads 
ADD COLUMN IF NOT EXISTS coordinates jsonb DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roads' AND column_name = 'coordinates';
