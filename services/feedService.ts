import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp;
}

const POSTS_COLLECTION = 'posts';

export const feedService = {
  // Create a new post
  createPost: async (userId: string, userDisplayName: string, content: string, userPhotoURL?: string, imageUrl?: string) => {
    return addDoc(collection(db, POSTS_COLLECTION), {
      userId,
      userDisplayName,
      userPhotoURL: userPhotoURL || '',
      content,
      imageUrl: imageUrl || '',
      createdAt: Timestamp.now(),
    });
  },

  // Get feed for a user (posts from followed users)
  getFeed: (followingIds: string[], callback: (posts: Post[]) => void) => {
    if (followingIds.length === 0) {
      callback([]);
      return () => {};
    }

    // Firestore 'in' query supports up to 10-30 elements depending on version, 
    // for MVP we'll assume a small number or handle batching later.
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('userId', 'in', followingIds),
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

  // Get all posts (for global feed if needed)
  getGlobalFeed: (callback: (posts: Post[]) => void) => {
    const q = query(
      collection(db, POSTS_COLLECTION),
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
  }
};
