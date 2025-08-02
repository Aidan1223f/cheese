-- Update existing community_posts table to add photos column
-- Run this in your Supabase SQL editor if you have existing posts

-- Add photos column to existing community_posts table
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Update existing posts to have empty photos array
UPDATE community_posts 
SET photos = '{}' 
WHERE photos IS NULL; 