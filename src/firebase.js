import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database 가져오기

const firebaseConfig = {
  apiKey: "AIzaSyBytCsVpW_pNzhVa7SumWiLIs2wDSohORM",
  authDomain: "gacha-my-player.firebaseapp.com",
  projectId: "gacha-my-player",
  storageBucket: "gacha-my-player.firebasestorage.app",
  messagingSenderId: "909196708696",
  appId: "1:909196708696:web:afbcc0799cc357eb47332d",
  measurementId: "G-GH7P22XNLR",
  databaseURL:
    "https://gacha-my-player-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// 1. Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 2. 서비스 객체 생성
const auth = getAuth(app);
const database = getDatabase(app); // 싱가포르 서버와 연결된 DB 객체

// 3. 다른 파일에서 쓸 수 있게 내보내기
export { auth, database };
