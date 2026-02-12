import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  TextInput,
  Image,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/hooks/useRedux';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { feedService, Post } from '@/services/feedService';
import { followService } from '@/services/followService';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function FeedScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const initFeed = async () => {
      try {
        const ids = await followService.getFollowingIds(user.uid);
        // Include self in feed to see own posts
        const feedIds = [...ids, user.uid];
        setFollowingIds(feedIds);

        const unsubscribe = feedService.getFeed(feedIds, (newPosts) => {
          setPosts(newPosts);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error initializing feed:', error);
        setLoading(false);
      }
    };

    initFeed();
  }, [user]);

  const handleCreatePost = async () => {
    if (!user || !postContent.trim()) return;

    setIsPosting(true);
    try {
      await feedService.createPost(
        user.uid,
        user.email?.split('@')[0] || 'User',
        postContent.trim(),
        user.photoURL || ''
      );
      setPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <View style={[styles.postCard, { borderBottomColor: themeColors.icon + '20' }]}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatarPlaceholder}>
          {item.userPhotoURL ? (
            <Image source={{ uri: item.userPhotoURL }} style={styles.postAvatar} />
          ) : (
            <IconSymbol name="person.fill" size={20} color="#fff" />
          )}
        </View>
        <View>
          <ThemedText type="defaultSemiBold">{item.userDisplayName}</ThemedText>
          <ThemedText style={styles.postDate}>
            {item.createdAt?.toDate().toLocaleDateString()}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.postContent}>{item.content}</ThemedText>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Feed</ThemedText>
      </View>

      <View style={[styles.createPostContainer, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}>
        <TextInput
          style={[styles.postInput, { color: themeColors.text }]}
          placeholder="What's on your mind?"
          placeholderTextColor={themeColors.icon}
          multiline
          value={postContent}
          onChangeText={setPostContent}
        />
        <TouchableOpacity 
          style={[styles.postButton, { backgroundColor: themeColors.tint }]} 
          onPress={handleCreatePost}
          disabled={isPosting || !postContent.trim()}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <ThemedText>No posts yet. Follow someone to see their feed!</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  postInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
  },
  postButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  postCard: {
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  postAvatar: {
    width: 40,
    height: 40,
  },
  postDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 40,
    textAlign: 'center',
  },
});
