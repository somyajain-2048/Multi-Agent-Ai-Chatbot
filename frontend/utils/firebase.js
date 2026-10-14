// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "chat-app-cd1c8.firebaseapp.com",
  projectId: "chat-app-cd1c8",
  storageBucket: "chat-app-cd1c8.firebasestorage.app",
  messagingSenderId: "312326968892",
  appId: "1:312326968892:web:510413c020ee44d02e9539"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();