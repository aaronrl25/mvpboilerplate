import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your own Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUFZL66Bf_HjkWO0IbpXMuXkcDwwDG1QU",
  authDomain: "faas-9c562.firebaseapp.com",
  projectId: "faas-9c562",
  storageBucket: "faas-9c562.appspot.com",
  messagingSenderId: "593019462213",
  appId: "1:593019462213:web:c88be1a1613dc0d6d4392c",
  measurementId: "G-0ZHL9D5ZHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication functions
export const registerUser = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Save user data to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.email?.split('@')[0] || 'User',
    createdAt: new Date().toISOString(),
    photoURL: user.photoURL || '',
  });
  
  return userCredential;
};

export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db, storage };
