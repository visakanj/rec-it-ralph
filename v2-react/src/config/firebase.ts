/**
 * Firebase Configuration
 *
 * This file initializes Firebase and sets window.firebase/window.database
 * to maintain compatibility with v1 AppState and DataAdapter.
 *
 * IMPORTANT: This must run BEFORE React mounts (handled in index.html)
 */

// Firebase config (same as v1)
export const firebaseConfig = {
  apiKey: "AIzaSyATWPODhqbeIpGrpbwYeTJG-m2LFAD0yEY",
  authDomain: "rec-it-ralph-f086b.firebaseapp.com",
  databaseURL: "https://rec-it-ralph-f086b-default-rtdb.firebaseio.com",
  projectId: "rec-it-ralph-f086b",
  storageBucket: "rec-it-ralph-f086b.firebasestorage.app",
  messagingSenderId: "59142094523",
  appId: "1:59142094523:web:fd8d6c899125f62b23739e",
  measurementId: "G-F8VYDHN758"
};

// Note: Actual initialization happens in index.html via CDN
// This file is for TypeScript reference only
