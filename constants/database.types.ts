export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          skin_goal: string | null;
          created_at: string;
          daily_streak?: number;
        };
        Insert: {
          id?: string;
          email: string;
          skin_goal?: string | null;
          created_at?: string;
          daily_streak?: number;
        };
        Update: {
          id?: string;
          email?: string;
          skin_goal?: string | null;
          created_at?: string;
          daily_streak?: number;
        };
      };
      skin_photos: {
        Row: {
          id: string;
          user_id: string;
          photo_url: string;
          mood_rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url: string;
          mood_rating: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          photo_url?: string;
          mood_rating?: number;
          created_at?: string;
        };
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          sender: 'user' | 'ai';
          context: 'checkin' | 'routine' | 'advice';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          sender: 'user' | 'ai';
          context: 'checkin' | 'routine' | 'advice';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          sender?: 'user' | 'ai';
          context?: 'checkin' | 'routine' | 'advice';
          created_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: 'advice' | 'support' | 'routine' | 'progress' | 'general';
          photos: string[];
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          category: 'advice' | 'support' | 'routine' | 'progress' | 'general';
          photos?: string[];
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          category?: 'advice' | 'support' | 'routine' | 'progress' | 'general';
          photos?: string[];
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export interface User {
  id: string;
  email: string;
  skin_goal?: string;
  created_at: string;
  routine_streak?: number;
  daily_streak?: number;
  // Onboarding fields
  first_name?: string;
  age?: number;
  skin_type?: string;
  skin_concerns?: string[];
  concerns_duration?: string;
  skin_goals?: string[];
  has_routine?: boolean;
  allergies?: string;
  onboarding_completed?: boolean;
}
export interface SkinPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  mood_rating: number;
  sleep_quality?: number | null;
  stress_level?: number | null;
  flare_ups?: number | null;
  created_at: string;
}
export type ChatMessage = Database['public']['Tables']['chat_history']['Row'];

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'advice' | 'support' | 'routine' | 'progress' | 'general';
  photos: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  user?: {
    email: string;
    first_name?: string;
  };
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  user?: {
    email: string;
    first_name?: string;
  };
} 
