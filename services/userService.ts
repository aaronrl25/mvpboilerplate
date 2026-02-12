import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  orderBy,
  startAt,
  endAt,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from './feedService';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  bio?: string;
  location?: string;
  followersCount?: number;
  followingCount?: number;
}

const USERS_COLLECTION = 'users';
const POSTS_COLLECTION = 'posts';

export const userService = {
  // Search users by display name or email
  searchUsers: async (searchTerm: string): Promise<UserProfile[]> => {
    if (!searchTerm) return [];
    
    const term = searchTerm.toLowerCase();
    
    // Firestore doesn't support full-text search or case-insensitive search easily
    // For a simple MVP, we can fetch users and filter them, or use prefix search
    const usersRef = collection(db, USERS_COLLECTION);
    
    // Prefix search for displayName
    const q = query(
      usersRef,
      orderBy('displayName'),
      startAt(searchTerm),
      endAt(searchTerm + '\uf8ff'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });

    return users;
  },

  // Get user details by UID
  getUserById: async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      return null;
    }
  },

  // Subscribe to user details by UID
  subscribeToUser: (uid: string, callback: (user: UserProfile | null) => void) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  },

  // Get user's posts
  getUserPosts: (uid: string, callback: (posts: Post[]) => void) => {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(
      postsRef,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      callback(posts);
    });
  },

  // Get all users (limited)
  getAllUsers: async (limitCount: number = 20): Promise<UserProfile[]> => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    
    return users;
  }
};
