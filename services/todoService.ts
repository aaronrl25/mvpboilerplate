import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  completed: boolean;
  createdAt: Timestamp;
}

export const TODO_CATEGORIES = [
  { id: 'personal', label: 'Personal', color: '#FF9800' },
  { id: 'work', label: 'Work', color: '#2196F3' },
  { id: 'shopping', label: 'Shopping', color: '#E91E63' },
  { id: 'health', label: 'Health', color: '#4CAF50' },
  { id: 'other', label: 'Other', color: '#9E9E9E' },
];

const TODOS_COLLECTION = 'todos';

export const todoService = {
  // Add a new todo
  addTodo: async (userId: string, todo: Omit<Todo, 'id' | 'userId' | 'createdAt' | 'completed'>) => {
    return addDoc(collection(db, TODOS_COLLECTION), {
      ...todo,
      userId,
      completed: false,
      createdAt: Timestamp.now(),
    });
  },

  // Update a todo
  updateTodo: async (id: string, updates: Partial<Todo>) => {
    const todoRef = doc(db, TODOS_COLLECTION, id);
    return updateDoc(todoRef, updates);
  },

  // Delete a todo
  deleteTodo: async (id: string) => {
    const todoRef = doc(db, TODOS_COLLECTION, id);
    return deleteDoc(todoRef);
  },

  // Subscribe to user's todos
  subscribeToTodos: (userId: string, callback: (todos: Todo[]) => void) => {
    const q = query(
      collection(db, TODOS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const todos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Todo[];
      callback(todos);
    });
  },

  // Upload photo to storage
  uploadTodoPhoto: async (userId: string, uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `todos/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }
};
