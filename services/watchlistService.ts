import { db } from './firebase';
import { doc, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export const addToWatchlist = async (userId: string, movieId: string) => {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    await updateDoc(userDocRef, {
      watchlist: arrayUnion(movieId)
    });
  } else {
    await setDoc(userDocRef, { 
      watchlist: [movieId]
    });
  }
};

export const removeFromWatchlist = async (userId: string, movieId: string) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      watchlist: arrayRemove(movieId)
    });
};

export const getWatchlist = async (userId:string): Promise<any[]> => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.watchlist || [];
    }
    return [];
}