import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  latitude?: number;
  longitude?: number;
  createdAt: Timestamp;
  likesCount?: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
}

const POSTS_COLLECTION = 'posts';
const LIKES_COLLECTION = 'likes';
const COMMENTS_COLLECTION = 'comments';

export const feedService = {
  // Upload media to Firebase Storage
  uploadMedia: async (uri: string, userId: string): Promise<{ url: string; type: 'image' | 'video' }> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExtension = uri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `posts/${fileName}`);
    
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    
    const type = uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov') ? 'video' : 'image';
    return { url, type };
  },

  // Create a new post
  createPost: async (
    userId: string, 
    userDisplayName: string, 
    content: string, 
    userPhotoURL?: string, 
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    latitude?: number,
    longitude?: number
  ) => {
    return addDoc(collection(db, POSTS_COLLECTION), {
      userId,
      userDisplayName,
      userPhotoURL: userPhotoURL || '',
      content,
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || null,
      latitude: latitude || null,
      longitude: longitude || null,
      createdAt: Timestamp.now(),
      likesCount: 0,
      commentsCount: 0,
    });
  },

  // Like/Unlike a post
  toggleLike: async (postId: string, userId: string) => {
    const likeRef = doc(db, LIKES_COLLECTION, `${postId}_${userId}`);
    const likeSnap = await getDoc(likeRef);
    const postRef = doc(db, POSTS_COLLECTION, postId);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { likesCount: increment(-1) });
      return false; // Unliked
    } else {
      await setDoc(likeRef, {
        postId,
        userId,
        createdAt: Timestamp.now(),
      });
      await updateDoc(postRef, { likesCount: increment(1) });
      return true; // Liked
    }
  },

  // Check if user liked a post
  isPostLiked: async (postId: string, userId: string): Promise<boolean> => {
    const likeRef = doc(db, LIKES_COLLECTION, `${postId}_${userId}`);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  },

  // Add a comment
  addComment: async (postId: string, userId: string, userDisplayName: string, content: string, userPhotoURL?: string) => {
    await addDoc(collection(db, COMMENTS_COLLECTION), {
      postId,
      userId,
      userDisplayName,
      userPhotoURL: userPhotoURL || '',
      content,
      createdAt: Timestamp.now(),
    });

    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, { commentsCount: increment(1) });
  },

  // Subscribe to comments for a post
  subscribeToComments: (postId: string, callback: (comments: Comment[]) => void) => {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      callback(comments);
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
