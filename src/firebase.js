import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // 1. Realtime DB 불러오기

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

// 2. 서비스 객체 생성
const auth = getAuth(app);
const database = getDatabase(app); // 3. database 변수 생성

// 4. 외부에서 쓸 수 있게 내보내기 (이 부분이 핵심!)
export { auth, database };
