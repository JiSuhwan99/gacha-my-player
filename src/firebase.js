import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBytCsVpW_pNzhVa7SumWiLIs2wDSohORM",
  authDomain: "gacha-my-player.firebaseapp.com",
  projectId: "gacha-my-player",
  storageBucket: "gacha-my-player.firebasestorage.app",
  messagingSenderId: "909196708696",
  appId: "1:909196708696:web:afbcc0799cc357eb47332d",
  measurementId: "G-GH7P22XNLR",
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
