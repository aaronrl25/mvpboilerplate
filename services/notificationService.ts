import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc, 
  updateDoc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'application_received' | 'status_change' | 'system';
  relatedId?: string; // Job ID or Application ID
  isRead: boolean;
  createdAt: Timestamp;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
  sendNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<string> => {
    try {
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const newNotification = {
        ...notification,
        isRead: false,
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(notificationsRef, newNotification);
      return docRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  getNotifications: async (userId: string, limitCount: number = 20): Promise<Notification[]> => {
    try {
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  subscribeToNotifications: (userId: string, callback: (notifications: Notification[]) => void) => {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    });
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    try {
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(document => 
        updateDoc(doc(db, NOTIFICATIONS_COLLECTION, document.id), { isRead: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
};
