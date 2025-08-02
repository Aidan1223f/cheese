-- Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (category IN ('advice', 'support', 'routine', 'progress', 'general')),
  photos TEXT[] DEFAULT '{}', -- Array of photo URLs
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Comments Table
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comment Likes Table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON community_comments(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_community_posts_updated_at 
  BEFORE UPDATE ON community_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at 
  BEFORE UPDATE ON community_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update comment count when comments are added/removed
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update like count when likes are added/removed
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update comment like count when likes are added/removed
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update comment count
CREATE TRIGGER update_post_comment_count_trigger
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Trigger to automatically update like count
CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Trigger to automatically update comment like count
CREATE TRIGGER update_comment_like_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- Row Level Security (RLS) policies
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies for community_posts
CREATE POLICY "Users can view all community posts" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for community_comments
CREATE POLICY "Users can view all comments" ON community_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON community_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON community_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for post_likes
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own post likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for comment_likes
CREATE POLICY "Users can view all comment likes" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own comment likes" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id); 