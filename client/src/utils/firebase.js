// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "interview-iq-8e6da.firebaseapp.com",
  projectId: "interview-iq-8e6da",
  storageBucket: "interview-iq-8e6da.firebasestorage.app",
  messagingSenderId: "130015741409",
  appId: "1:130015741409:web:6eaa68ab41a57f8cb7fea0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
