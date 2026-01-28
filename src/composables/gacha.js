import { ref, onMounted } from "vue";
import { auth, database } from "../firebase.js";
import { ref as dbRef, set, get } from "firebase/database";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
export function useGacha() {
  const playerDb = ref({});
  const isModalOpen = ref(false);
  const isSaveModalOpen = ref(false);
  const gachaOptions = ref([]);
  const squad = ref({});
  const currentPos = ref("");
  const currentSlotKey = ref("");
  const saveData = ref({
    id: "",
    nickname: "", // 닉네임 추가
    pw: "",
    pwConfirm: "", // 비밀번호 확인 추가
  });

  // 추가된 상태
  const isLoggedIn = ref(false);
  const authMode = ref("login");
  const showToast = ref(false);
  const toastMessage = ref("");

  onMounted(async () => {
    try {
      const response = await fetch("/playersDb.json");
      playerDb.value = await response.json();
    } catch (e) {
      console.error("데이터 로드 실패", e);
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        isLoggedIn.value = true;
        console.log("로그인 확인:", user.displayName);
        await loadUserSquad(user.uid);
      } else {
        // 🔴 로그아웃 되었을 때 처리
        isLoggedIn.value = false;
        isSaved.value = false; // ✅ 여기서 false로 바꿔줘야 로그아웃 시 버튼이 다시 나타납니다!
        squad.value = {}; // (선택사항) 로그아웃 시 화면의 선수들도 비우고 싶다면 추가
      }
    });
  });

  const triggerToast = (msg) => {
    toastMessage.value = msg;
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 1500);
  };

  // 로그인 모달 열기
  const openLoginModal = () => {
    authMode.value = "login";
    ((saveData.value = {
      id: "",
      nickname: "", // 추가
      pw: "",
      pwConfirm: "",
    }),
      (isSaveModalOpen.value = true));
  };

  // 저장 모달 열기
  const openSaveModal = () => {
    const filledSlots = Object.keys(squad.value).length;
    if (filledSlots < 11) {
      triggerToast("모든 선수를 뽑은 후에 저장해 주세요!");
      return;
    }
    authMode.value = "save";
    isSaveModalOpen.value = true;
  };

  const openRegisterModal = () => {
    authMode.value = "register";
    saveData.value = { id: "", nickname: "", pw: "", pwConfirm: "" }; // 초기화
    isSaveModalOpen.value = true;
  };
  const currentGachaResults = ref({});
  const openGacha = (pos, n) => {
    const slotKey = pos + n;

    // 이미 선수가 확정된 슬롯이면 무시
    if (squad.value[slotKey] || !playerDb.value[pos]) return;

    currentPos.value = pos;
    currentSlotKey.value = slotKey;

    // 2. 이미 이 슬롯에 생성된 결과가 있는지 확인
    if (currentGachaResults.value[slotKey]) {
      // 이미 있다면 새로운 랜덤을 돌리지 않고 저장된 값을 사용
      gachaOptions.value = currentGachaResults.value[slotKey];
    } else {
      // 없다면 새로 생성 (중복 제거 로직 포함)

      // 현재 필드에 배치된 모든 선수의 ID 목록 추출
      const takenIds = Object.values(squad.value).map((p) => p.id);

      // 전체 DB에서 이미 배치된 선수를 제외하고 섞기
      const filteredPool = playerDb.value[pos].filter(
        (p) => !takenIds.includes(p.id),
      );

      // 후보가 3명보다 적을 경우를 대비해 예외 처리 후 3명 추출
      const newOptions = [...filteredPool]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      // 결과를 상태에 저장 (다음에 열 때 고정하기 위함)
      currentGachaResults.value[slotKey] = newOptions;
      gachaOptions.value = newOptions;
    }

    isModalOpen.value = true;
  };

  const selectPlayer = (player) => {
    squad.value[currentSlotKey.value] = player;

    // 선수를 확정했으므로 해당 슬롯의 임시 가차 결과는 삭제
    delete currentGachaResults.value[currentSlotKey.value];

    isModalOpen.value = false;
  };

  const handleImageError = (e) => {
    e.target.src = "/src/assets/images/unknown_player.png";
  };

  const handleRegister = async () => {
    try {
      // 1. 아이디 유효성 검사 (영문+숫자 포함, 4자 이상)
      const idRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{4,}$/;
      if (!idRegex.test(saveData.value.id)) {
        triggerToast("아이디는 영문과 숫자를 포함하여 4자 이상이어야 합니다.");
        return;
      }

      // 2. 닉네임 유효성 검사 (기존 요청: 10자 이내)
      if (!saveData.value.nickname || saveData.value.nickname.length > 10) {
        triggerToast("닉네임은 10자 이내로 입력해주세요.");
        return;
      }

      // 3. 비밀번호 확인 검사
      if (saveData.value.pw !== saveData.value.pwConfirm) {
        triggerToast("비밀번호가 일치하지 않습니다!");
        return;
      }

      if (saveData.value.pw.length < 6) {
        triggerToast("비밀번호는 6자리 이상이어야 합니다.");
        return;
      }

      // 4. Firebase 계정 생성 (아이디 뒤에 @test.com을 붙여서 이메일처럼 처리)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        `${saveData.value.id}@test.com`,
        saveData.value.pw,
      );

      // 5. 닉네임 설정
      await updateProfile(userCredential.user, {
        displayName: saveData.value.nickname,
      });

      triggerToast(`${saveData.value.nickname}님, 가입을 환영합니다!`);
      authMode.value = "login";
    } catch (e) {
      console.error(e);
      if (e.code === "auth/email-already-in-use") {
        triggerToast("이미 존재하는 아이디입니다.");
      } else {
        triggerToast("가입 실패: " + e.message);
      }
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        `${saveData.value.id}@test.com`,
        saveData.value.pw,
      );
      isLoggedIn.value = true;
      isSaveModalOpen.value = false;
      triggerToast("반가워요!");
      loadUserSquad(); // 로그인 시 데이터 불러오기
    } catch (e) {
      triggerToast("로그인 정보를 확인하세요.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      isLoggedIn.value = false;
      isSaved.value = false; // ✅ 로그아웃 버튼 클릭 시 즉시 초기화
      squad.value = {};
      triggerToast("로그아웃 되었습니다.");
    } catch (error) {
      console.error("로그아웃 에러:", error);
    }
  };

  const submitSave = async () => {
    console.log("저장 프로세스 시작!"); // 확인용

    if (!isLoggedIn.value || !auth.currentUser) {
      console.log("로그인 안 됨 -> 모달 오픈");
      authMode.value = "login";
      isSaveModalOpen.value = true;
      return;
    }

    try {
      const user = auth.currentUser;
      const userRef = dbRef(database, `users/${user.uid}`);

      await set(userRef, {
        nickname: user.displayName || "익명",
        squad: squad.value,
        updatedAt: Date.now(),
      });

      isSaved.value = true; // ✅ 저장 성공하면 버튼 숨기기 위해 true!
      triggerToast("성공적으로 저장되었습니다!");
    } catch (e) {
      console.error(e);
    }
  };

  const isSaved = ref(false); // 저장 여부 상태 추가

  // 1. 데이터를 불러올 때 확인
  const loadUserSquad = async (uid) => {
    try {
      const userRef = dbRef(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.squad && Object.keys(data.squad).length > 0) {
          squad.value = data.squad;
          isSaved.value = true; // ✅ 저장된 데이터가 있으면 true!
          console.log("저장된 스쿼드 로드 완료");
        }
      }
    } catch (error) {
      console.error("불러오기 에러:", error);
    }
  };

  return {
    isSaved,
    isModalOpen,
    isSaveModalOpen,
    gachaOptions,
    squad,
    saveData,
    currentPos,
    showToast,
    toastMessage,
    isLoggedIn,
    auth,
    authMode,
    openGacha,
    selectPlayer,
    handleImageError,
    triggerToast,
    openLoginModal,
    openSaveModal,
    openRegisterModal,
    handleRegister,
    handleLogin,
    handleLogout,
    submitSave,
  };
}
