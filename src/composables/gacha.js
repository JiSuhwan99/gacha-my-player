import { ref, onMounted } from "vue";
import { auth, db } from "../firebase.js";
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

    onAuthStateChanged(auth, (user) => {
      if (user) {
        // 로그인된 상태
        isLoggedIn.value = true;
        loadUserSquad();
        console.log("로그인 유지 성공:", user.displayName);
      } else {
        // 로그아웃된 상태
        isLoggedIn.value = false;
        squad.value = {};
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
      await auth.signOut();
      triggerToast("로그아웃 되었습니다.");
    } catch (e) {
      triggerToast("로그아웃 실패");
    }
  };

  const submitSave = async () => {
    if (!auth.currentUser) return triggerToast("로그인이 필요합니다.");

    try {
      await setDoc(doc(db, "squads", auth.currentUser.uid), {
        userId: saveData.value.id,
        squad: squad.value,
        updatedAt: new Date(),
      });
      triggerToast("구글 서버에 안전하게 저장됨! ☁️");
      isSaveModalOpen.value = false;
    } catch (e) {
      triggerToast("저장 중 오류 발생");
    }
  };

  const loadUserSquad = async () => {
    if (!auth.currentUser) return;
    const docSnap = await getDoc(doc(db, "squads", auth.currentUser.uid));
    if (docSnap.exists()) {
      squad.value = docSnap.data().squad;
    }
  };

  return {
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
