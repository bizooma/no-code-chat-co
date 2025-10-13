-- Add presenter_id column to replace the removed avatar_id
ALTER TABLE avatar_chatbots 
ADD COLUMN presenter_id TEXT DEFAULT 'anna_public_3_20240108' NOT NULL;