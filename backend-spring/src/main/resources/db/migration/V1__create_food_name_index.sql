-- Create index on foods.name for search optimization
-- This index supports prefix search patterns (e.g., name ILIKE 'query%')
CREATE INDEX IF NOT EXISTS idx_food_name ON foods(name);
