-- Remove the deprecated avatar_id column from avatar_chatbots
-- D-ID agents use presenter configuration instead
ALTER TABLE avatar_chatbots DROP COLUMN IF EXISTS avatar_id;