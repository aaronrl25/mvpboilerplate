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
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  bio?: string;
  location?: string;
}

const USERS_COLLECTION = 'users';

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
