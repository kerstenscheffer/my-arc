-- Voeg coach_id column toe als die mist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id);
