-- =====================================================
-- MY ARC INGREDIENTS & RECIPES DATABASE SCHEMA
-- =====================================================

-- 1. INGREDIENTS TABLE (Basis bouwstenen)
-- =====================================================
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- 'vlees', 'groente', 'zuivel', 'granen', etc.
  
  -- Macro's per 100g
  per_100g_kcal INTEGER NOT NULL DEFAULT 0,
  per_100g_protein DECIMAL(5,2) NOT NULL DEFAULT 0,
  per_100g_carbs DECIMAL(5,2) NOT NULL DEFAULT 0,
  per_100g_fat DECIMAL(5,2) NOT NULL DEFAULT 0,
  per_100g_fiber DECIMAL(5,2) DEFAULT 0,
  
  -- Extra nutritional info
  per_100g_sugar DECIMAL(5,2) DEFAULT 0,
  per_100g_saturated_fat DECIMAL(5,2) DEFAULT 0,
  per_100g_sodium INTEGER DEFAULT 0, -- in mg
  
  -- Units & purchasing
  default_unit TEXT DEFAULT 'gram', -- 'gram', 'ml', 'stuk'
  purchase_unit TEXT DEFAULT 'gram', -- 'kg', 'stuk', 'pak'
  grams_per_unit DECIMAL(7,2) DEFAULT 100, -- hoeveel gram is 1 unit
  
  -- Metadata
  barcode TEXT,
  brand TEXT,
  supermarket TEXT, -- 'AH', 'Jumbo', etc.
  price_per_unit DECIMAL(6,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. RECIPES TABLE (Recepten met ingrediënten)
-- =====================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack'
  
  -- Base portion info
  base_portion_grams INTEGER DEFAULT 350,
  servings INTEGER DEFAULT 1,
  
  -- Calculated totals (for quick access)
  total_kcal INTEGER,
  total_protein DECIMAL(5,2),
  total_carbs DECIMAL(5,2),
  total_fat DECIMAL(5,2),
  
  -- Recipe details
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  instructions TEXT,
  
  -- Flags
  is_scalable BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_dairy_free BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. RECIPE_INGREDIENTS TABLE (Koppeltabel)
-- =====================================================
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
  
  -- Amount in recipe
  amount DECIMAL(7,2) NOT NULL,
  unit TEXT DEFAULT 'gram',
  
  -- Optional overrides for this specific use
  preparation TEXT, -- 'gekookt', 'gebakken', 'rauw'
  is_optional BOOLEAN DEFAULT false,
  
  -- Order for display
  display_order INTEGER DEFAULT 0,
  
  UNIQUE(recipe_id, ingredient_id)
);

-- 4. UPDATE MEALS TABLE (Add recipe connection)
-- =====================================================
ALTER TABLE meals ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS base_portion_grams INTEGER DEFAULT 350;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_recipe_based BOOLEAN DEFAULT false;

-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_meals_recipe ON meals(recipe_id);

-- 6. EXAMPLE DATA INSERT
-- =====================================================

-- Insert basic ingredients
INSERT INTO ingredients (name, category, per_100g_kcal, per_100g_protein, per_100g_carbs, per_100g_fat, default_unit) VALUES
('Ei (gekookt)', 'zuivel', 155, 13, 1.1, 10.6, 'stuk'),
('Kipfilet', 'vlees', 165, 31, 0, 3.6, 'gram'),
('Havermout', 'granen', 389, 16.9, 66.3, 6.9, 'gram'),
('Griekse Yoghurt', 'zuivel', 97, 9, 3.6, 5, 'gram'),
('Broccoli', 'groente', 34, 2.8, 6.6, 0.4, 'gram'),
('Rijst (gekookt)', 'granen', 130, 2.7, 28.2, 0.3, 'gram'),
('Zalm', 'vis', 208, 20, 0, 13, 'gram'),
('Avocado', 'groente', 160, 2, 8.5, 14.7, 'stuk'),
('Quinoa (gekookt)', 'granen', 120, 4.4, 21.3, 1.9, 'gram'),
('Blauwe Bessen', 'fruit', 57, 0.7, 14.5, 0.3, 'gram');

-- Insert example recipe
INSERT INTO recipes (name, category, base_portion_grams, total_kcal, total_protein, total_carbs, total_fat) VALUES
('Power Breakfast Bowl', 'breakfast', 400, 520, 35, 45, 18);

-- Link ingredients to recipe (example)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES
((SELECT id FROM recipes WHERE name = 'Power Breakfast Bowl'), 
 (SELECT id FROM ingredients WHERE name = 'Havermout'), 60, 'gram'),
((SELECT id FROM recipes WHERE name = 'Power Breakfast Bowl'), 
 (SELECT id FROM ingredients WHERE name = 'Griekse Yoghurt'), 150, 'gram'),
((SELECT id FROM recipes WHERE name = 'Power Breakfast Bowl'), 
 (SELECT id FROM ingredients WHERE name = 'Blauwe Bessen'), 100, 'gram'),
((SELECT id FROM recipes WHERE name = 'Power Breakfast Bowl'), 
 (SELECT id FROM ingredients WHERE name = 'Ei (gekookt)'), 100, 'gram');

-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate recipe totals from ingredients
CREATE OR REPLACE FUNCTION calculate_recipe_macros(recipe_uuid UUID)
RETURNS TABLE(kcal INT, protein DECIMAL, carbs DECIMAL, fat DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CAST(SUM((i.per_100g_kcal * ri.amount / 100)) AS INT) as kcal,
    SUM((i.per_100g_protein * ri.amount / 100)) as protein,
    SUM((i.per_100g_carbs * ri.amount / 100)) as carbs,
    SUM((i.per_100g_fat * ri.amount / 100)) as fat
  FROM recipe_ingredients ri
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = recipe_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe macros when ingredients change
CREATE OR REPLACE FUNCTION update_recipe_macros()
RETURNS TRIGGER AS $$
DECLARE
  macros RECORD;
BEGIN
  SELECT * INTO macros FROM calculate_recipe_macros(NEW.recipe_id);
  
  UPDATE recipes 
  SET 
    total_kcal = macros.kcal,
    total_protein = macros.protein,
    total_carbs = macros.carbs,
    total_fat = macros.fat,
    updated_at = NOW()
  WHERE id = NEW.recipe_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_macros
AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION update_recipe_macros();

-- 8. RLS POLICIES
-- =====================================================

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Everyone can read ingredients
CREATE POLICY "ingredients_read_all" ON ingredients
  FOR SELECT USING (true);

-- Only coaches can modify ingredients
CREATE POLICY "ingredients_write_coach" ON ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'coach'
    )
  );

-- Everyone can read recipes
CREATE POLICY "recipes_read_all" ON recipes
  FOR SELECT USING (true);

-- Coaches can manage recipes
CREATE POLICY "recipes_write_coach" ON recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'coach'
    )
  );

-- Same for recipe_ingredients
CREATE POLICY "recipe_ingredients_read_all" ON recipe_ingredients
  FOR SELECT USING (true);

CREATE POLICY "recipe_ingredients_write_coach" ON recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'coach'
    )
  );
