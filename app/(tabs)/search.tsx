import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  Image
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { userService, UserProfile } from '@/services/userService';
import { followService } from '@/services/followService';
import { useAppSelector } from '@/hooks/useRedux';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SearchScreen() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // Initial load of users
    loadInitialUsers();
    if (currentUser) {
      loadFollowingIds();
    }
  }, [currentUser]);

  const loadFollowingIds = async () => {
    if (!currentUser) return;
    try {
      const ids = await followService.getFollowingIds(currentUser.uid);
      setFollowingIds(ids);
    } catch (error) {
      console.error('Error loading following IDs:', error);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    if (!currentUser || followLoading) return;
    
    setFollowLoading(true);
    try {
      const isCurrentlyFollowing = followingIds.includes(userId);
      if (isCurrentlyFollowing) {
        await followService.unfollowUser(currentUser.uid, userId);
        setFollowingIds(prev => prev.filter(id => id !== userId));
      } else {
        await followService.followUser(currentUser.uid, userId);
        setFollowingIds(prev => [...prev, userId]);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const loadInitialUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await userService.getAllUsers(20);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 1) {
      setLoading(true);
      try {
        const results = await userService.searchUsers(text);
        setUsers(results);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    } else if (text.length === 0) {
      loadInitialUsers();
    }
  };

  const navigateToProfile = (uid: string) => {
    router.push({ pathname: '/user/[uid]', params: { uid } });
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      style={[styles.userItem, { borderBottomColor: themeColors.icon + '20' }]} 
      onPress={() => navigateToProfile(item.uid)}
    >
      <View style={styles.avatarPlaceholder}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <IconSymbol name="person.fill" size={24} color="#fff" />
        )}
      </View>
      <View style={styles.userInfo}>
        <ThemedText type="defaultSemiBold">{item.displayName}</ThemedText>
        <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
      </View>
      {currentUser && item.uid !== currentUser.uid && (
        <TouchableOpacity 
          style={[
            styles.followButton, 
            followingIds.includes(item.uid) ? styles.followingButton : { backgroundColor: themeColors.tint }
          ]}
          onPress={() => handleFollowToggle(item.uid)}
          disabled={followLoading}
        >
          <ThemedText style={followingIds.includes(item.uid) ? styles.followingButtonText : styles.followButtonText}>
            {followingIds.includes(item.uid) ? 'Following' : 'Follow'}
          </ThemedText>
        </TouchableOpacity>
      )}
      <IconSymbol name="chevron.right" size={20} color={themeColors.icon} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Search Users</ThemedText>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}>
        <IconSymbol name="magnifyingglass" size={20} color={themeColors.icon} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search by name..."
          placeholderTextColor={themeColors.icon}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={themeColors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <ThemedText>No users found</ThemedText>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 50,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  avatar: {
    width: 45,
    height: 45,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.6,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  modalBody: {
    padding: 20,
  },
  largeAvatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  largeAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  largeAvatar: {
    width: 120,
    height: 120,
  },
  modalUserName: {
    marginBottom: 5,
  },
  modalUserEmail: {
    opacity: 0.6,
  },
  detailSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 15,
  },
  bioText: {
    lineHeight: 22,
    opacity: 0.8,
  },
  followButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
});
