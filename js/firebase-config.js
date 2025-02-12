import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } 
  from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5gjkbcUrcnRVU_5pdFfjGsfKTNVi99fY",
  authDomain: "alunos-9848d.firebaseapp.com",
  projectId: "alunos-9848d",
  storageBucket: "alunos-9848d.firebasestorage.app",
  messagingSenderId: "697570485120",
  appId: "1:697570485120:web:54a240fd98ad429cf3d765",
  measurementId: "G-BV9W40L6D8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider, signInWithEmailAndPassword, signInWithPopup };