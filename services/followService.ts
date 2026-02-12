import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  Timestamp,
  increment,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const FOLLOWS_COLLECTION = 'follows';
const USERS_COLLECTION = 'users';

export const followService = {
  // Follow a user
  followUser: async (followerId: string, followingId: string) => {
    if (followerId === followingId) return;

    const followRef = doc(db, FOLLOWS_COLLECTION, `${followerId}_${followingId}`);
    await setDoc(followRef, {
      followerId,
      followingId,
      createdAt: Timestamp.now(),
    });

    // Update follow counts in users collection
    const followerRef = doc(db, USERS_COLLECTION, followerId);
    const followingRef = doc(db, USERS_COLLECTION, followingId);

    await updateDoc(followerRef, { followingCount: increment(1) });
    await updateDoc(followingRef, { followersCount: increment(1) });
  },

  // Unfollow a user
  unfollowUser: async (followerId: string, followingId: string) => {
    const followRef = doc(db, FOLLOWS_COLLECTION, `${followerId}_${followingId}`);
    await deleteDoc(followRef);

    // Update follow counts in users collection
    const followerRef = doc(db, USERS_COLLECTION, followerId);
    const followingRef = doc(db, USERS_COLLECTION, followingId);

    await updateDoc(followerRef, { followingCount: increment(-1) });
    await updateDoc(followingRef, { followersCount: increment(-1) });
  },

  // Toggle follow
  toggleFollow: async (followerId: string, followingId: string): Promise<boolean> => {
    const followRef = doc(db, FOLLOWS_COLLECTION, `${followerId}_${followingId}`);
    const followSnap = await getDoc(followRef);

    if (followSnap.exists()) {
      await followService.unfollowUser(followerId, followingId);
      return false;
    } else {
      await followService.followUser(followerId, followingId);
      return true;
    }
  },

  // Check if following
  isFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
    const followRef = doc(db, FOLLOWS_COLLECTION, `${followerId}_${followingId}`);
    const followSnap = await getDoc(followRef);
    return followSnap.exists();
  },

  // Get following IDs
  getFollowingIds: async (userId: string): Promise<string[]> => {
    const q = query(
      collection(db, FOLLOWS_COLLECTION),
      where('followerId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().followingId);
  }
};
