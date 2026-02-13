import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { UserRole } from './userService';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGOzuIJB01mP5XKniDy5n-RGBjrzPmCgI",
  authDomain: "nearminds-c8079.firebaseapp.com",
  databaseURL: "https://nearminds-c8079-default-rtdb.firebaseio.com",
  projectId: "nearminds-c8079",
  storageBucket: "nearminds-c8079.appspot.com",
  messagingSenderId: "102644372523",
  appId: "1:102644372523:web:ab8bf2c07f26f81ab1c66e",
  measurementId: "G-1SBJH1FKNK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication functions
export const registerUser = async (email: string, password: string, role: UserRole = 'seeker') => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Save user data to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.email?.split('@')[0] || 'User',
    createdAt: new Date().toISOString(),
    photoURL: user.photoURL || '',
    role: role,
  });
  
  return userCredential;
};

export const getUserData = async (uid: string) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
};

export const logoutUser = () => {
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db, storage };
