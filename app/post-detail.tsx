import { PhotoGallery } from '@/components/PhotoGallery';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { CommunityComment, CommunityPost } from '@/constants/database.types';
import { useSupabase } from '@/hooks/useSupabase';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostDetailScreen() {
  const { postId, isLiked, likesCount } = useLocalSearchParams<{ 
    postId: string;
    isLiked?: string;
    likesCount?: string;
  }>();
  const router = useRouter();
  const { user, getCommunityPost, getCommunityComments, createCommunityComment, togglePostLike, toggleCommentLike } = useSupabase();
  
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    if (postId) {
      loadPostAndComments();
    }
  }, [postId]);

  // Refresh comment like states when returning to this screen
  useFocusEffect(
    useCallback(() => {
      if (post && comments.length > 0) {
        refreshPostAndCommentLikeStates();
      }
    }, [post, comments.length])
  );

  const refreshPostAndCommentLikeStates = async () => {
    try {
      console.log('Refreshing post and comment like states for post:', postId);
      
      // Refresh post like state
      if (post) {
        const freshPost = await getCommunityPost(postId);
        if (freshPost) {
          setPost(prevPost => ({
            ...prevPost!,
            is_liked: freshPost.is_liked,
            likes_count: freshPost.likes_count
          }));
        }
      }
      
      // Refresh comment like states
      const freshComments = await getCommunityComments(postId);
      
      // Update only the like states of existing comments
      setComments(prevComments => {
        const updatedComments = prevComments.map(prevComment => {
          const freshComment = freshComments.find(fc => fc.id === prevComment.id);
          if (freshComment) {
            const updatedComment = {
              ...prevComment,
              is_liked: freshComment.is_liked,
              likes_count: freshComment.likes_count
            };
            
            // Log if there's a change in like state
            if (prevComment.is_liked !== freshComment.is_liked) {
              console.log(`Comment ${prevComment.id} like state updated: ${prevComment.is_liked} -> ${freshComment.is_liked}`);
            }
            
            return updatedComment;
          }
          return prevComment;
        });
        
        console.log(`Updated ${updatedComments.length} comments with fresh like states`);
        return updatedComments;
      });
    } catch (error) {
      console.error('Error refreshing post and comment like states:', error);
    }
  };

  const loadPostAndComments = async () => {
    try {
      setLoading(true);
      console.log('Loading post and comments for postId:', postId);
      console.log('Current user:', user?.id);
      
      const [postData, commentsData] = await Promise.all([
        getCommunityPost(postId),
        getCommunityComments(postId)
      ]);
      
      console.log('Loaded post data:', postData);
      console.log('Loaded comments data:', commentsData);
      
      // If we have passed parameters, use them to override the initial like status
      if (postData && isLiked !== undefined && likesCount !== undefined) {
        postData.is_liked = isLiked === 'true';
        postData.likes_count = parseInt(likesCount);
      }
      
      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      await createCommunityComment(postId, newComment.trim());
      
      // Reset form and reload comments
      setNewComment('');
      await loadPostAndComments();
      
      Alert.alert('Success', 'Comment added successfully!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;
    
    try {
      // Store the original state in case we need to revert
      const originalIsLiked = post.is_liked;
      const originalLikesCount = post.likes_count;
      
      // Optimistically update the UI
      const updatedPost = { ...post };
      updatedPost.likes_count = post.is_liked ? post.likes_count - 1 : post.likes_count + 1;
      updatedPost.is_liked = !post.is_liked;
      setPost(updatedPost);
      
      // Call the API to update the like status
      await togglePostLike(postId);
      
      // If successful, the optimistic update stays
      console.log(`Post ${postId} like toggled successfully`);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert the optimistic update on error
      await loadPostAndComments();
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      console.log('handleLikeComment called for commentId:', commentId);
      
      // Find the comment and update it optimistically
      const commentIndex = comments.findIndex(comment => comment.id === commentId);
      if (commentIndex === -1) {
        console.log('Comment not found in comments array');
        return;
      }

      const updatedComments = [...comments];
      const comment = updatedComments[commentIndex];
      
      console.log('Original comment state:', {
        id: comment.id,
        is_liked: comment.is_liked,
        likes_count: comment.likes_count
      });
      
      // Store the original state in case we need to revert
      const originalIsLiked = comment.is_liked;
      const originalLikesCount = comment.likes_count;
      
      // Optimistically update the UI
      comment.likes_count = comment.is_liked ? comment.likes_count - 1 : comment.likes_count + 1;
      comment.is_liked = !comment.is_liked;
      
      console.log('Optimistically updated comment state:', {
        id: comment.id,
        is_liked: comment.is_liked,
        likes_count: comment.likes_count
      });
      
      setComments(updatedComments);
      
      // Call the API to update the like status
      await toggleCommentLike(commentId);
      
      // If successful, the optimistic update stays
      console.log(`Comment ${commentId} like toggled successfully`);
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert the optimistic update on error
      await loadPostAndComments();
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  };

  const handleBackPress = () => {
    // When going back, we don't need to do anything special since we removed the useFocusEffect
    // that was causing the community screen to reload
    router.back();
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Post Not Found</Text>
          <Text style={styles.errorText}>The post you're looking for doesn't exist or has been removed.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <IconSymbol name="chevron.left" size={24} color="#424242" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 110}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <ScrollView style={styles.content}>
        {/* Post Content */}
        <View style={styles.postCard}>
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
          <Text style={styles.postContent}>{post.content}</Text>
          
          {/* Display photos if any */}
          {post.photos && post.photos.length > 0 && (
            <PhotoGallery photos={post.photos} />
          )}
          
                     <View style={styles.postFooter}>
             <View style={styles.postStats}>
               <TouchableOpacity
                 style={styles.likeButton}
                 onPress={handleLikePost}
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
                 style={styles.commentIconButton}
                 onPress={() => {
                   // Focus the comment input to open keyboard
                   if (commentInputRef.current) {
                     commentInputRef.current.focus();
                   }
                 }}
               >
                 <IconSymbol name="bubble.left" size={16} color="#757575" />
                 <Text style={styles.postStatsText}>{post.comments_count}</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>
          
          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <IconSymbol name="bubble.left" size={32} color="#E0E0E0" />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>
                Be the first to share your thoughts!
              </Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    {comment.user?.first_name || comment.user?.email || 'Anonymous'}
                  </Text>
                  <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <View style={styles.commentFooter}>
                  <TouchableOpacity 
                    style={styles.likeButton}
                    onPress={() => handleLikeComment(comment.id)}
                  >
                    <IconSymbol 
                      name="heart" 
                      size={14} 
                      color={comment.is_liked ? "#E91E63" : "#757575"} 
                    />
                    <Text style={[styles.likeButtonText, comment.is_liked && styles.likedText]}>
                      {comment.likes_count}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <View style={styles.commentInputWrapper}>
                                 <TextInput
                   ref={commentInputRef}
                   style={styles.commentInput}
                   placeholder="Add a comment..."
                   value={newComment}
                   onChangeText={setNewComment}
                   multiline
                   maxLength={500}
                 />
                <TouchableOpacity
                  style={[styles.submitButton, (!newComment.trim() || submittingComment) && styles.submitButtonDisabled]}
                  onPress={handleSubmitComment}
                  disabled={!newComment.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
                 </TouchableWithoutFeedback>
       </KeyboardAvoidingView>
     </SafeAreaView>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8FAE8B',
    marginTop: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  postContent: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
  },
  postFooter: {
    marginTop: 16,
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
  commentsSection: {
    marginHorizontal: 16,
    marginBottom: 120, // Increased space for comment input
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 4,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  commentDate: {
    fontSize: 12,
    color: '#757575',
  },
  commentContent: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  commentFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  likeButtonText: {
    fontSize: 12,
    color: '#757575',
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    paddingBottom: 20, // Reduced padding to minimize white space
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8FAE8B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  commentIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likedText: {
    color: '#E91E63',
  },
}); 