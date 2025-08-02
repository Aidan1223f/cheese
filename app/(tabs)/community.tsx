import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { CommunityPost } from '@/constants/database.types';
import { useSupabase } from '@/hooks/useSupabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CommunityScreen() {
  const router = useRouter();
  const { user, getCommunityPosts, createCommunityPost, togglePostLike } = useSupabase();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'advice' | 'support' | 'routine' | 'progress' | 'general'>('general');
  const [creatingPost, setCreatingPost] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const categories = [
    { key: 'advice', label: 'Advice', icon: 'lightbulb.fill' },
    { key: 'support', label: 'Support', icon: 'heart.fill' },
    { key: 'routine', label: 'Routine', icon: 'clock.fill' },
    { key: 'progress', label: 'Progress', icon: 'chart.line.uptrend.xyaxis' },
    { key: 'general', label: 'General', icon: 'bubble.left.fill' },
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  // Only refresh like states when returning to this screen, not reload all posts
  useFocusEffect(
    useCallback(() => {
      if (posts.length > 0) {
        refreshLikeStates();
      }
    }, [posts.length])
  );

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await getCommunityPosts(20);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const refreshLikeStates = async () => {
    try {
      console.log('Refreshing like states for community posts...');
      // Only fetch the like states for existing posts, not reload everything
      const fetchedPosts = await getCommunityPosts(20);
      
      // Update only the like states of existing posts
      setPosts(prevPosts => {
        const updatedPosts = prevPosts.map(prevPost => {
          const fetchedPost = fetchedPosts.find(fp => fp.id === prevPost.id);
          if (fetchedPost) {
            const updatedPost = {
              ...prevPost,
              is_liked: fetchedPost.is_liked,
              likes_count: fetchedPost.likes_count
            };
            
            // Log if there's a change in like state
            if (prevPost.is_liked !== fetchedPost.is_liked) {
              console.log(`Post ${prevPost.id} like state updated: ${prevPost.is_liked} -> ${fetchedPost.is_liked}`);
            }
            
            return updatedPost;
          }
          return prevPost;
        });
        
        console.log(`Updated ${updatedPosts.length} posts with fresh like states`);
        return updatedPosts;
      });
    } catch (error) {
      console.error('Error refreshing like states:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      setCreatingPost(true);
      await createCommunityPost(newPostTitle.trim(), newPostContent.trim(), newPostCategory);
      
      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCategory('general');
      setShowCreateForm(false);
      
      // Reload posts
      await loadPosts();
      
      Alert.alert('Success', 'Your post has been created!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'advice': return '#4A90E2';
      case 'support': return '#E91E63';
      case 'routine': return '#8FAE8B';
      case 'progress': return '#F4D03F';
      default: return '#757575';
    }
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      // TODO: Implement comment submission
      console.log('Comment submitted:', commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
      Keyboard.dismiss();
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      // Find the post and update it optimistically
      const postIndex = posts.findIndex(post => post.id === postId);
      if (postIndex === -1) return;

      const updatedPosts = [...posts];
      const post = updatedPosts[postIndex];
      
      // Store original state for logging
      const originalIsLiked = post.is_liked;
      const originalLikesCount = post.likes_count;
      
      // Optimistically update the UI
      post.likes_count = post.is_liked ? post.likes_count - 1 : post.likes_count + 1;
      post.is_liked = !post.is_liked;
      
      console.log(`Optimistically updating post ${postId}: like=${originalIsLiked}->${post.is_liked}, count=${originalLikesCount}->${post.likes_count}`);
      
      setPosts(updatedPosts);
      
      // Call the API to update the like status
      await togglePostLike(postId);
      
      console.log(`Post ${postId} like toggled successfully in database`);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert the optimistic update on error
      await loadPosts();
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  };

  const handlePostPress = (post: CommunityPost) => {
    // Pass the current post data (including like status) to the post detail screen
    router.push({
      pathname: '/post-detail',
      params: { 
        postId: post.id,
        isLiked: post.is_liked?.toString(),
        likesCount: post.likes_count?.toString()
      }
    });
  };

  // Function to update post like state when returning from post detail
  const updatePostLikeState = (postId: string, isLiked: boolean, likesCount: number) => {
    const postIndex = posts.findIndex(post => post.id === postId);
    if (postIndex !== -1) {
      const updatedPosts = [...posts];
      updatedPosts[postIndex].is_liked = isLiked;
      updatedPosts[postIndex].likes_count = likesCount;
      setPosts(updatedPosts);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading community posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateForm(true)}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.content}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="bubble.left" size={48} color={Colors.light.tint} />
            <Text style={styles.emptyStateTitle}>No posts yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to share your skincare journey with the community!
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Text style={styles.emptyStateButtonText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
                 ) : (
           posts.map((post) => (
             <TouchableOpacity
               key={post.id}
               style={styles.postCard}
               onPress={() => handlePostPress(post)}
             >
               <View style={styles.postHeader}>
                 <View style={styles.postMeta}>
                   <Text style={styles.postAuthor}>
                     {post.user?.first_name || post.user?.email || 'Anonymous'}
                   </Text>
                   <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                 </View>
                 <View style={styles.categoryBadge}>
                   <Text style={[styles.categoryText, { color: getCategoryColor(post.category) }]}>
                     {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                   </Text>
                 </View>
               </View>
               
               <Text style={styles.postTitle}>{post.title}</Text>
               <Text style={styles.postContent} numberOfLines={3}>
                 {post.content}
               </Text>
               
               <View style={styles.postFooter}>
                 <View style={styles.postStats}>
                   <TouchableOpacity
                     style={styles.likeButton}
                     onPress={() => handleLikePost(post.id)}
                   >
                     <IconSymbol 
                       name="heart" 
                       size={16} 
                       color={post.is_liked ? "#E91E63" : "#757575"} 
                     />
                     <Text style={[styles.postStatsText, post.is_liked && styles.likedText]}>
                       {post.likes_count}
                     </Text>
                   </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.commentButton}
                      onPress={() => setShowCommentInput(true)}
                    >
                      <IconSymbol name="bubble.left" size={16} color="#757575" />
                      <Text style={styles.postStatsText}>{post.comments_count}</Text>
                    </TouchableOpacity>
                 </View>
               </View>
             </TouchableOpacity>
           ))
         )}
               </ScrollView>

        {/* Comment Input Bar */}
        {showCommentInput && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleCommentSubmit}
            />
            <TouchableOpacity
              style={[
                styles.commentSendButton,
                !commentText.trim() && styles.commentSendButtonDisabled
              ]}
              onPress={handleCommentSubmit}
              disabled={!commentText.trim()}
            >
              <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
            
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Create Post Modal */}
      {showCreateForm && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContent}
              >
                <ScrollView 
                  style={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Post</Text>
              <TouchableOpacity
                onPress={() => setShowCreateForm(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={24} color="#757575" />
              </TouchableOpacity>
            </View>



            <TextInput
              style={styles.titleInput}
              placeholder="Post title..."
              value={newPostTitle}
              onChangeText={setNewPostTitle}
              maxLength={100}
              returnKeyType="next"
              blurOnSubmit={false}
              keyboardType="default"
              enablesReturnKeyAutomatically={true}
            />

            <Text style={styles.categoryLabel}>Category:</Text>
            <View style={styles.categorySelector}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryOption,
                    newPostCategory === category.key && styles.categoryOptionSelected
                  ]}
                  onPress={() => setNewPostCategory(category.key as any)}
                >
                  <IconSymbol
                    name={category.icon as any}
                    size={16}
                    color={newPostCategory === category.key ? '#FFFFFF' : '#757575'}
                  />
                  <Text style={[
                    styles.categoryOptionText,
                    newPostCategory === category.key && styles.categoryOptionTextSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.contentInput}
              placeholder="Share your thoughts, ask for advice, or celebrate your progress..."
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              numberOfLines={6}
              maxLength={1000}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
              keyboardType="default"
              enablesReturnKeyAutomatically={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createPostButton, creatingPost && styles.createPostButtonDisabled]}
                onPress={handleCreatePost}
                disabled={creatingPost}
              >
                {creatingPost ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createPostButtonText}>Create Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#424242',
  },
  createButton: {
    backgroundColor: '#8FAE8B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    backgroundColor: '#8FAE8B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  postDate: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
  },
  postFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postStatsText: {
    fontSize: 14,
    color: '#757575',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
  },
  modalScrollContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#424242',
  },
  closeButton: {
    padding: 4,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  categoryOptionSelected: {
    backgroundColor: '#8FAE8B',
    borderColor: '#8FAE8B',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#757575',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#757575',
  },
  createPostButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8FAE8B',
    alignItems: 'center',
  },
  createPostButtonDisabled: {
    opacity: 0.6,
  },
  createPostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 52,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  commentSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8FAE8B',
  },
  commentSendButtonDisabled: {
    opacity: 0.5,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likedText: {
    color: '#E91E63',
  },
}); 