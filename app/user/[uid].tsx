import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { userService, UserProfile } from '@/services/userService';
import { feedService, Post } from '@/services/feedService';
import { followService } from '@/services/followService';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UserProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (!uid) return;

    // Subscribe to user details
    const unsubscribeUser = userService.subscribeToUser(uid, (data) => {
      setProfile(data);
    });

    // Subscribe to user posts
    const unsubscribePosts = userService.getUserPosts(uid, (data) => {
      setPosts(data);
      setLoading(false);
      
      // Check liked status for these posts
      if (currentUser) {
        data.forEach(async (post) => {
          const liked = await feedService.isPostLiked(post.id, currentUser.uid);
          if (liked) {
            setLikedPosts(prev => new Set(prev).add(post.id));
          }
        });
      }
    });

    // Check follow status
    if (currentUser && uid !== currentUser.uid) {
      followService.isFollowing(currentUser.uid, uid).then(setIsFollowing);
    }

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [uid, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser || !uid || uid === currentUser.uid) return;
    
    try {
      const following = await followService.toggleFollow(currentUser.uid, uid);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!currentUser) return;
    try {
      const liked = await feedService.toggleLike(postId, currentUser.uid);
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (liked) next.add(postId);
        else next.delete(postId);
        return next;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
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

  if (loading && !profile) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>User not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: profile.displayName, headerShown: true }} />
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.profileInfoSection}>
              <View style={styles.profileImageContainer}>
                {profile.photoURL ? (
                  <Image source={{ uri: profile.photoURL }} style={styles.profileImage} />
                ) : (
                  <IconSymbol name="person.fill" size={60} color="#fff" />
                )}
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText type="defaultSemiBold">{posts.length}</ThemedText>
                  <ThemedText style={styles.statLabel}>Posts</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText type="defaultSemiBold">{profile.followersCount || 0}</ThemedText>
                  <ThemedText style={styles.statLabel}>Followers</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText type="defaultSemiBold">{profile.followingCount || 0}</ThemedText>
                  <ThemedText style={styles.statLabel}>Following</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.profileDetails}>
              <ThemedText type="title">{profile.displayName}</ThemedText>
              {profile.bio ? <ThemedText style={styles.bioText}>{profile.bio}</ThemedText> : null}
              {profile.location ? (
                <View style={styles.locationRow}>
                  <IconSymbol name="map.fill" size={14} color={themeColors.icon} />
                  <ThemedText style={styles.locationText}>{profile.location}</ThemedText>
                </View>
              ) : null}
            </View>

            {currentUser && uid !== currentUser.uid && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  { backgroundColor: isFollowing ? 'transparent' : themeColors.tint },
                  isFollowing && { borderColor: themeColors.tint, borderWidth: 1 }
                ]}
                onPress={handleFollowToggle}
              >
                <ThemedText style={{ color: isFollowing ? themeColors.tint : '#fff', fontWeight: '600' }}>
                  {isFollowing ? 'Following' : 'Follow'}
                </ThemedText>
              </TouchableOpacity>
            )}
            
            <View style={[styles.divider, { backgroundColor: themeColors.icon + '20' }]} />
            <ThemedText type="defaultSemiBold" style={styles.postsTitle}>Posts</ThemedText>
          </View>
        }
        renderItem={renderPostItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No posts yet.</ThemedText>
          </View>
        }
      />
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
  profileHeader: {
    padding: 20,
  },
  profileInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 100,
    height: 100,
  },
  statsRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  profileDetails: {
    marginBottom: 20,
  },
  bioText: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    opacity: 0.6,
  },
  followButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 15,
  },
  postsTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  postCard: {
    padding: 20,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  postAvatar: {
    width: 36,
    height: 36,
  },
  postDate: {
    fontSize: 11,
    opacity: 0.5,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#000',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});