import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

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

// Authentication functions
export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
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

export { auth };
