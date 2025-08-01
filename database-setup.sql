-- Glow AI Skin Coach Database Setup
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  skin_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skin_photos table
CREATE TABLE IF NOT EXISTS skin_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  photo_url TEXT NOT NULL,
  mood_rating INTEGER NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  context TEXT NOT NULL CHECK (context IN ('checkin', 'routine', 'advice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skin_photos_user_id ON skin_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_skin_photos_created_at ON skin_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_context ON chat_history(context);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Skin photos policies (simplified to avoid RLS issues)
CREATE POLICY "Users can view own photos" ON skin_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON skin_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON skin_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON skin_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Alternative: Disable RLS for skin_photos if policies are causing issues
-- ALTER TABLE skin_photos DISABLE ROW LEVEL SECURITY;

-- Disable RLS for skin_photos to fix photo upload issues
ALTER TABLE skin_photos DISABLE ROW LEVEL SECURITY;

-- Disable RLS for chat_history to avoid similar issues
ALTER TABLE chat_history DISABLE ROW LEVEL SECURITY;

-- Chat history policies (commented out since RLS is disabled)
-- CREATE POLICY "Users can view own chat history" ON chat_history
--   FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own chat messages" ON chat_history
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for photos
-- Note: You'll need to create this in the Supabase dashboard
-- Go to Storage > Create a new bucket called 'skin-photos'
-- Set it to public for easy access

-- Function to handle new user signup (completely disabled)
-- DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; 

-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skin_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skin_concerns TEXT[]; -- Array of concerns
ALTER TABLE users ADD COLUMN IF NOT EXISTS concerns_duration TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skin_goals TEXT[]; -- Array of goals
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_routine BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update the existing skin_goal column to be part of the new skin_goals array
-- We'll keep the old column for backward compatibility but new data will go to skin_goals 

-- Add new columns to skin_photos table for enhanced check-in
ALTER TABLE skin_photos ADD COLUMN sleep_quality integer;
ALTER TABLE skin_photos ADD COLUMN stress_level integer;
ALTER TABLE skin_photos ADD COLUMN flare_ups integer;

-- Add daily_streak column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0; 