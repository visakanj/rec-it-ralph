import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyATWPODhqbeIpGrpbwYeTJG-m2LFAD0yEY",
  authDomain: "rec-it-ralph-f086b.firebaseapp.com",
  databaseURL: "https://rec-it-ralph-f086b-default-rtdb.firebaseio.com",
  projectId: "rec-it-ralph-f086b",
  storageBucket: "rec-it-ralph-f086b.firebasestorage.app",
  messagingSenderId: "59142094523",
  appId: "1:59142094523:web:fd8d6c899125f62b23739e",
  measurementId: "G-F1K8QW2LKH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);