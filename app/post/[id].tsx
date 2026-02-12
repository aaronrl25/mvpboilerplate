import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { feedService, Post, Comment } from '@/services/feedService';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (!id) return;

    // Subscribe to post changes
    const unsubscribePost = onSnapshot(doc(db, 'posts', id), (snapshot) => {
      if (snapshot.exists()) {
        setPost({ id: snapshot.id, ...snapshot.data() } as Post);
      }
      setLoading(false);
    });

    // Subscribe to comments
    const unsubscribeComments = feedService.subscribeToComments(id, (fetchedComments) => {
      setComments(fetchedComments);
    });

    // Check if liked
    if (user) {
      feedService.isPostLiked(id, user.uid).then(setIsLiked);
    }

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [id, user]);

  const handleLikeToggle = async () => {
    if (!user || !post) return;
    try {
      const liked = await feedService.toggleLike(post.id, user.uid);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !id || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await feedService.addComment(
        id,
        user.uid,
        user.email?.split('@')[0] || 'User',
        newComment.trim(),
        user.photoURL || ''
      );
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </ThemedView>
    );
  }

  if (!post) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Post not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Post Detail', headerShown: true }} />
      
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.postSection}>
            <View style={styles.postHeader}>
              <View style={styles.avatarPlaceholder}>
                {post.userPhotoURL ? (
                  <Image source={{ uri: post.userPhotoURL }} style={styles.avatar} />
                ) : (
                  <IconSymbol name="person.fill" size={24} color="#fff" />
                )}
              </View>
              <View>
                <ThemedText type="defaultSemiBold">{post.userDisplayName}</ThemedText>
                <ThemedText style={styles.postDate}>
                  {post.createdAt?.toDate().toLocaleDateString()}
                </ThemedText>
              </View>
            </View>

            {post.content ? <ThemedText style={styles.postContent}>{post.content}</ThemedText> : null}
            
            {post.mediaUrl ? (
              post.mediaType === 'video' ? (
                <Video
                  source={{ uri: post.mediaUrl }}
                  style={styles.postMedia}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                />
              ) : (
                <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} />
              )
            ) : post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.postMedia} />
            ) : null}

            <View style={[styles.postActions, { borderTopColor: themeColors.icon + '20', borderBottomColor: themeColors.icon + '20' }]}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
                <IconSymbol 
                  name={isLiked ? "heart.fill" : "heart"} 
                  size={24} 
                  color={isLiked ? "#E91E63" : themeColors.icon} 
                />
                <ThemedText style={styles.actionText}>{post.likesCount || 0} Likes</ThemedText>
              </TouchableOpacity>
              <View style={styles.actionButton}>
                <IconSymbol name="bubble.left.fill" size={24} color={themeColors.icon} />
                <ThemedText style={styles.actionText}>{post.commentsCount || 0} Comments</ThemedText>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <View style={styles.commentAvatarPlaceholder}>
                {item.userPhotoURL ? (
                  <Image source={{ uri: item.userPhotoURL }} style={styles.commentAvatar} />
                ) : (
                  <IconSymbol name="person.fill" size={16} color="#fff" />
                )}
              </View>
              <View style={styles.commentInfo}>
                <ThemedText type="defaultSemiBold" style={styles.commentUser}>
                  {item.userDisplayName}
                </ThemedText>
                <ThemedText style={styles.commentContent}>{item.content}</ThemedText>
                <ThemedText style={styles.commentDate}>
                  {item.createdAt?.toDate().toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: themeColors.background, borderTopColor: themeColors.icon + '20' }]}>
          <TextInput
            style={[styles.input, { color: themeColors.text, backgroundColor: colorScheme === 'dark' ? '#222' : '#f5f5f5' }]}
            placeholder="Add a comment..."
            placeholderTextColor={themeColors.icon}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: themeColors.tint, opacity: !newComment.trim() || isSubmitting ? 0.6 : 1 }]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol name="paperplane.fill" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  postSection: {
    padding: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 44,
    height: 44,
  },
  postDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  postContent: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 15,
  },
  postMedia: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: '#000',
  },
  postActions: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  commentHeader: {
    flexDirection: 'row',
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  commentAvatar: {
    width: 32,
    height: 32,
  },
  commentInfo: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 20,
    opacity: 0.9,
  },
  commentDate: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
