import { db } from './firebase';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const addToWatchlist = async (userId: string, movieId: string) => {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    watchlist: arrayUnion(movieId)
  });
};

const removeFromWatchlist = async (userId: string, movieId: string) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      watchlist: arrayRemove(movieId)
    });
};

const getWatchlist = async (userId:string): Promise<string[]> => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.watchlist || [];
    }
    return [];
}

export const watchlistService = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
};