import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4ltrBJpSZFTK-3w76AOsUNjAA_da9Q5U",
  authDomain: "itthad-dairy-system.firebaseapp.com",
  projectId: "itthad-dairy-system",
  storageBucket: "itthad-dairy-system.firebasestorage.app",
  messagingSenderId: "139330881340",
  appId: "1:139330881340:web:012aedede2ef3abca5c039",
  measurementId: "G-87DWHYR1FP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
