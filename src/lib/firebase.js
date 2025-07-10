import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAVZx8tZTJW7ghtIQ564wh8knPU60LBqi0",
  authDomain: "react-chat-app-e74f7.firebaseapp.com",
  projectId: "react-chat-app-e74f7",
  storageBucket: "react-chat-app-e74f7.firebasestorage.app",
  messagingSenderId: "774163181699",
  appId: "1:774163181699:web:af776959018c8eccd76bb6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();