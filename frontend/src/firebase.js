import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBm8q2R6uVKa71ceNjSm8TWvLLuFvdDi_I',
  authDomain: 'cultureclick-94afa.firebaseapp.com',
  projectId: 'cultureclick-94afa',
  storageBucket: 'cultureclick-94afa.firebasestorage.app',
  messagingSenderId: '489050018894',
  appId: '1:489050018894:web:9b42b97b8027429a095f1f',
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

