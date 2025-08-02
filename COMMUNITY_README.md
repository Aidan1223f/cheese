# Community Feature

This document describes the community functionality that allows users to create posts, ask for advice, and interact with each other.

## Features

### Community Posts
- **Create Posts**: Users can create posts with titles, content, and categories
- **Categories**: Posts can be categorized as:
  - Advice: For asking and giving skincare advice
  - Support: For emotional support and encouragement
  - Routine: For sharing and discussing skincare routines
  - Progress: For celebrating achievements and milestones
  - General: For general discussions

### Comments
- **Add Comments**: Users can comment on posts
- **View Comments**: All comments are visible to all users
- **Real-time Updates**: Comment counts are automatically updated

### User Interface
- **Community Tab**: New tab in the bottom navigation
- **Post List**: Shows all community posts with preview
- **Post Detail**: Full post view with comments
- **Create Post Modal**: Modal for creating new posts
- **Responsive Design**: Follows the design system guidelines

## Database Schema

### community_posts Table
```sql
CREATE TABLE community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'general',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### community_comments Table
```sql
CREATE TABLE community_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Functions

### Posts
- `createCommunityPost(title, content, category)`: Create a new post
- `getCommunityPosts(limit, orderBy, order)`: Get all posts with pagination
- `getCommunityPost(id)`: Get a specific post with user info
- `updateCommunityPost(id, updates)`: Update a post (owner only)
- `deleteCommunityPost(id)`: Delete a post (owner only)

### Comments
- `createCommunityComment(postId, content)`: Add a comment to a post
- `getCommunityComments(postId, limit)`: Get comments for a post
- `updateCommunityComment(id, updates)`: Update a comment (owner only)
- `deleteCommunityComment(id)`: Delete a comment (owner only)

## Security

### Row Level Security (RLS)
- Users can view all posts and comments
- Users can only create/update/delete their own posts and comments
- Automatic comment count updates via database triggers

### Data Validation
- Post titles limited to 100 characters
- Post content limited to 1000 characters
- Comment content limited to 500 characters
- Category validation (must be one of the predefined categories)

## UI Components

### Community Screen (`app/(tabs)/community.tsx`)
- Main community feed
- Create post button
- Post preview cards
- Pull-to-refresh functionality
- Empty state handling

### Post Detail Screen (`app/(tabs)/post-detail.tsx`)
- Full post view
- Comments section
- Add comment functionality
- Navigation back to community

## Design System Compliance

The community feature follows the design system guidelines:

### Colors
- Primary: Sage green (#8FAE8B) for buttons and accents
- Secondary: Cream (#F5F1E8) for backgrounds
- Accent: Blue (#4A90E2) for advice category
- Neutral: Gray scale for text and borders

### Typography
- H1 (28px, 700): Main headers
- H2 (22px, 600): Section headers
- Body (16px, 400): Main content
- Caption (14px, 400): Secondary text

### Spacing
- 8px base unit
- 16px for card padding
- 24px for component spacing
- 32px for section spacing

### Components
- Cards with 16px border radius and subtle shadows
- Buttons with 12px border radius
- Inputs with 8px border radius
- Consistent padding and margins

## Setup Instructions

1. **Database Setup**: Run the SQL schema in `community-schema.sql`
2. **Navigation**: The community tab is already added to the tab layout
3. **Types**: Database types are updated in `constants/database.types.ts`
4. **Hooks**: Community functions are added to `hooks/useSupabase.ts`

## Usage

1. **View Posts**: Navigate to the Community tab to see all posts
2. **Create Post**: Tap the + button to create a new post
3. **View Post**: Tap on any post to see full content and comments
4. **Add Comment**: Scroll to bottom of post detail to add a comment
5. **Refresh**: Pull down on the community feed to refresh

## Future Enhancements

- Like functionality for posts and comments
- Post editing and deletion
- Comment editing and deletion
- Post search and filtering
- User profiles and avatars
- Image uploads in posts
- Push notifications for new comments
- Post moderation features 