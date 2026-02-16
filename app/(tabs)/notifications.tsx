import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  View, 
  RefreshControl,
  Platform
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/hooks/useRedux';
import { notificationService, Notification } from '@/services/notificationService';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDistanceToNow } from 'date-fns';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { EmptyState } from '@/components/EmptyState';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead && notification.id) {
      await notificationService.markAsRead(notification.id);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }

    // Navigation logic based on type
    if (notification.type === 'application_received' && notification.relatedId) {
      // For employers, go to application review
      router.push({
        pathname: "/applications/[id]",
        params: { id: notification.relatedId }
      } as any);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        { 
          backgroundColor: theme.surface, 
          borderColor: item.isRead ? theme.border : theme.primary + '20',
          ...Shadows.sm 
        },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.isRead ? theme.background : theme.primary + '10' }]}>
        <IconSymbol 
          name={getIconName(item.type)} 
          size={22} 
          color={item.isRead ? theme.textTertiary : theme.primary} 
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <ThemedText type="defaultSemiBold" style={[styles.title, { color: theme.text }]}>{item.title}</ThemedText>
          {!item.isRead && (
            <View style={[styles.newBadge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.message, { color: theme.textSecondary }]} numberOfLines={2}>{item.message}</ThemedText>
        <ThemedText style={[styles.time, { color: theme.textTertiary }]}>
          {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const getIconName = (type: Notification['type']): any => {
    switch (type) {
      case 'application_received': return 'person.badge.plus.fill';
      case 'status_change': return 'info.circle.fill';
      case 'system': return 'bell.fill';
      default: return 'bell.fill';
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title" style={{ color: theme.text }}>Notifications</ThemedText>
          <ThemedText style={{ color: theme.textSecondary, fontSize: 14 }}>
            Stay updated with your activities
          </ThemedText>
        </View>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity 
            onPress={markAllRead}
            style={[styles.markReadButton, { backgroundColor: theme.primary + '10' }]}
          >
            <ThemedText style={[styles.markReadText, { color: theme.primary }]}>Mark all as read</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="bell.slash"
            title="No notifications"
            message="We'll notify you when something important happens."
            style={{ marginTop: 80 }}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  markReadButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
});
