# 🧴 Glow AI Skin Coach

A minimal, habit-focused AI skincare app built with React Native + Expo, using Supabase for backend and OpenAI for AI chat guidance.

## ✨ Features

- **Daily Check-In**: Take photos and rate skin mood with AI encouragement
- **Guided Routine**: Chat-driven skincare sessions (cleanser → moisturizer → SPF)
- **AI Advice**: Freeform Q&A for skincare questions and tips
- **Progress Tracking**: Visual photo grid, streaks, and mood tracking
- **Consistency Focus**: Streak tracking and motivational AI messages

## 🛠️ Tech Stack

- **React Native + Expo**
- **React Navigation** (Bottom Tabs)
- **react-native-gifted-chat** (AI chat)
- **Supabase** (Auth, DB, Storage)
- **OpenAI GPT-4o** (chat guidance)
- **Expo Camera** for photo upload
- **AsyncStorage** for local caching

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Supabase Setup

1. Create a Supabase project
2. Create the following tables:

#### `users` table
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  skin_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `skin_photos` table
```sql
CREATE TABLE skin_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  photo_url TEXT NOT NULL,
  mood_rating INTEGER NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `chat_history` table
```sql
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  context TEXT NOT NULL CHECK (context IN ('checkin', 'routine', 'advice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Create a storage bucket called `skin-photos`
4. Update `constants/supabase.ts` with your Supabase URL and anon key

### 4. Run the App

```bash
npx expo start
```

## 📱 App Screens

### Check-In
- Take daily photos with camera
- Rate skin mood (1-5)
- Get AI encouragement
- Track streaks

### Routine
- Chat-driven skincare guidance
- Step-by-step routine support
- Quick action buttons

### Advice
- Freeform AI Q&A
- Popular question suggestions
- Non-medical advice only

### Progress
- Weekly photo grid
- Streak and mood statistics
- Badge system for consistency

## 🤖 AI Features

- **Context-aware responses** for different screens
- **Encouraging tone** focused on consistency
- **Non-medical advice** only
- **Brief responses** (1-2 sentences)
- **Emoji usage** (max 1 per message)

## 🎯 MVP Constraints

- No product scanning or recommendations
- No multiple routines
- No health data integrations
- No image processing (just upload/display)
- Focus on consistency and emotional connection

## 📊 Database Schema

### Users
- `id` (UUID, FK to auth.users)
- `email` (TEXT)
- `skin_goal` (TEXT)
- `created_at` (TIMESTAMP)

### Skin Photos
- `id` (UUID)
- `user_id` (UUID, FK)
- `photo_url` (TEXT)
- `mood_rating` (INTEGER 1-5)
- `created_at` (TIMESTAMP)

### Chat History
- `id` (UUID)
- `user_id` (UUID, FK)
- `message` (TEXT)
- `sender` (TEXT: 'user' | 'ai')
- `context` (TEXT: 'checkin' | 'routine' | 'advice')
- `created_at` (TIMESTAMP)

## 🔧 Development

### Project Structure
```
app/
  (tabs)/
    checkin.tsx      # Daily photo check-in
    routine.tsx      # Guided skincare routine
    advice.tsx       # AI Q&A chat
    progress.tsx     # Progress tracking
  auth.tsx          # Authentication screen
  _layout.tsx       # Root layout with auth
components/
  PhotoUpload.tsx   # Camera/photo component
hooks/
  useSupabase.ts    # Supabase operations
  useOpenAIChat.ts  # OpenAI chat integration
constants/
  database.types.ts # TypeScript types
  supabase.ts       # Supabase client
```

### Key Components

- **PhotoUpload**: Camera integration with expo-image-picker
- **useSupabase**: Authentication, photo upload, data management
- **useOpenAIChat**: Context-aware AI responses
- **GiftedChat**: Chat interface for routine and advice

## 🎨 Design Principles

- **Minimal and focused** on core functionality
- **Emotional connection** through AI encouragement
- **Consistency tracking** with streaks and badges
- **Simple UX** for daily 5-minute routine
- **Supportive AI** that never gives medical advice

## 📝 License

MIT License
