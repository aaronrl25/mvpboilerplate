import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  TextInput,
  Image,
  Alert,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Video, ResizeMode } from 'expo-av';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/hooks/useRedux';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { feedService, Post } from '@/services/feedService';
import { followService } from '@/services/followService';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FeedScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [attachedLocation, setAttachedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
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

        const unsubscribe = feedService.getFeed(feedIds, async (newPosts) => {
          setPosts(newPosts);
          setLoading(false);
          
          // Check which posts are liked
          const likedSet = new Set<string>();
          for (const post of newPosts) {
            const liked = await feedService.isPostLiked(post.id, user.uid);
            if (liked) likedSet.add(post.id);
          }
          setLikedPosts(likedSet);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error initializing feed:', error);
        setLoading(false);
      }
    };

    initFeed();
  }, [user]);

  const handleLikeToggle = async (postId: string) => {
    if (!user) return;
    try {
      const isLiked = await feedService.toggleLike(postId, user.uid);
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (isLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const pickMedia = async (type: 'image' | 'video') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
      setMediaType(type);
    }
  };

  const toggleLocation = async () => {
    if (attachedLocation) {
      setAttachedLocation(null);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to tag your post.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      setAttachedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  const handleCreatePost = async () => {
    if (!user || (!postContent.trim() && !selectedMedia)) return;

    setIsPosting(true);
    try {
      let uploadedMediaUrl = '';
      let uploadedMediaType: 'image' | 'video' | undefined;

      if (selectedMedia) {
        const uploadResult = await feedService.uploadMedia(selectedMedia, user.uid);
        uploadedMediaUrl = uploadResult.url;
        uploadedMediaType = uploadResult.type;
      }

      await feedService.createPost(
        user.uid,
        user.email?.split('@')[0] || 'User',
        postContent.trim(),
        user.photoURL || '',
        uploadedMediaUrl,
        uploadedMediaType,
        attachedLocation?.latitude,
        attachedLocation?.longitude
      );

      setPostContent('');
      setSelectedMedia(null);
      setMediaType(null);
      setAttachedLocation(null);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <View style={[styles.postCard, { borderBottomColor: themeColors.icon + '20' }]}>
      <TouchableOpacity 
        style={styles.postHeader}
        onPress={() => router.push({ pathname: '/user/[uid]', params: { uid: item.userId } })}
      >
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
      </TouchableOpacity>
      {item.content ? <ThemedText style={styles.postContent}>{item.content}</ThemedText> : null}
      
      {item.mediaUrl ? (
        item.mediaType === 'video' ? (
          <Video
            source={{ uri: item.mediaUrl }}
            style={styles.postMedia}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        ) : (
          <Image source={{ uri: item.mediaUrl }} style={styles.postMedia} />
        )
      ) : item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.postMedia} />
      ) : null}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleLikeToggle(item.id)}
        >
          <IconSymbol 
            name={likedPosts.has(item.id) ? "heart.fill" : "heart"} 
            size={20} 
            color={likedPosts.has(item.id) ? "#E91E63" : themeColors.icon} 
          />
          <ThemedText style={styles.actionText}>{item.likesCount || 0}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
        >
          <IconSymbol name="bubble.left.fill" size={20} color={themeColors.icon} />
          <ThemedText style={styles.actionText}>{item.commentsCount || 0}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Feed</ThemedText>
      </View>

      <View style={[styles.createPostContainer, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.postInput, { color: themeColors.text }]}
            placeholder="Share an update or job opportunity..."
            placeholderTextColor={themeColors.icon}
            value={postContent}
            onChangeText={setPostContent}
            multiline
          />
          <TouchableOpacity 
            style={[styles.postButton, { backgroundColor: themeColors.tint }]} 
            onPress={handleCreatePost}
            disabled={isPosting || (!postContent.trim() && !selectedMedia)}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol name="paperplane.fill" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {selectedMedia && (
          <View style={styles.mediaPreviewContainer}>
            {mediaType === 'video' ? (
              <Video
                source={{ uri: selectedMedia }}
                style={styles.mediaPreview}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
              />
            ) : (
              <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} />
            )}
            <TouchableOpacity 
              style={styles.removeMediaButton} 
              onPress={() => {
                setSelectedMedia(null);
                setMediaType(null);
              }}
            >
              <IconSymbol name="xmark.circle.fill" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mediaButtonsRow}>
          <TouchableOpacity style={styles.mediaPickerButton} onPress={() => pickMedia('image')}>
            <IconSymbol name="photo.fill" size={20} color={themeColors.tint} />
            <ThemedText style={[styles.mediaPickerText, { color: themeColors.tint }]}>Photo</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaPickerButton} onPress={() => pickMedia('video')}>
            <IconSymbol name="video.fill" size={20} color={themeColors.tint} />
            <ThemedText style={[styles.mediaPickerText, { color: themeColors.tint }]}>Video</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mediaPickerButton, attachedLocation && { backgroundColor: themeColors.tint + '20' }]} 
            onPress={toggleLocation}
          >
            <IconSymbol 
              name="map.fill" 
              size={20} 
              color={attachedLocation ? themeColors.tint : themeColors.icon} 
            />
            <ThemedText style={[
              styles.mediaPickerText, 
              { color: attachedLocation ? themeColors.tint : themeColors.icon }
            ]}>
              {attachedLocation ? 'Location Tagged' : 'Location'}
            </ThemedText>
          </TouchableOpacity>
        </View>
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
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  mediaButtonsRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 15,
  },
  mediaPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
  },
  mediaPickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediaPreviewContainer: {
    marginTop: 15,
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
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
    marginBottom: 10,
  },
  postMedia: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: '#000',
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 14,
    opacity: 0.8,
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
