import { ref, onMounted, computed } from "vue"; // computed 추가
import { auth, database } from "../firebase.js";
import { ref as dbRef, set, get } from "firebase/database";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut,
} from "firebase/auth";

export function useGacha() {
  // 1. 상태 변수 선언 (순서가 중요합니다)
  const playerDb = ref({});
  const isModalOpen = ref(false);
  const isSaveModalOpen = ref(false);
  const isLoggedIn = ref(false);
  const isSaved = ref(false); // ✅ 위로 올림
  const authMode = ref("login");

  const gachaOptions = ref([]);
  const squad = ref({});
  const currentPos = ref("");
  const currentSlotKey = ref("");
  const currentGachaResults = ref({});

  const saveData = ref({
    id: "",
    nickname: "",
    pw: "",
    pwConfirm: "",
  });

  const showToast = ref(false);
  const toastMessage = ref("");

  // 2. 초기화 및 로그인 감시
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
        isSaveModalOpen.value = false; // 로그인 감지되면 모달 닫기
        await loadUserSquad(user.uid);
      } else {
        isLoggedIn.value = false;
        isSaved.value = false;
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

  // 3. 모달 제어 함수
  const openLoginModal = () => {
    authMode.value = "login";
    saveData.value = { id: "", nickname: "", pw: "", pwConfirm: "" };
    isSaveModalOpen.value = true;
  };

  const openRegisterModal = () => {
    authMode.value = "register";
    saveData.value = { id: "", nickname: "", pw: "", pwConfirm: "" };
    isSaveModalOpen.value = true;
  };

  // 4. 가차 및 선수 선택 로직
  const teamColors = {
    "Team Tiger": "#ff9800", // 주황색
    "Blue Dragon": "#2196f3", // 파란색
    "Red Phoenix": "#f44336", // 빨간색
    "Silver Wolf": "#9e9e9e", // 은색/회색
    "Golden Eagle": "#ffeb3b", // 노란색/금색
  };
  const selectPlayer = (player) => {
    if (!currentSlotKey.value) {
      console.error("슬롯 키가 없습니다!");
      return;
    }

    // 1. 새로운 선수 객체 생성 (기존 정보 + 팀 컬러 추가)
    const playerWithColor = {
      ...player,
      teamColor: teamColors[player.team] || "#ffffff",
    };

    // 2. 반응형 데이터인 squad에 정확한 키값으로 할당 (예: 'DF1', 'MF2')
    squad.value[currentSlotKey.value] = playerWithColor;

    // 3. 해당 슬롯의 가챠 결과 데이터 삭제 (다시 뽑을 때 새로운 목록을 위해)
    delete currentGachaResults.value[currentSlotKey.value];

    // 4. 모달 닫기 및 초기화
    isModalOpen.value = false;
    gachaOptions.value = [];

    console.log(
      `${currentSlotKey.value} 슬롯에 선수 배치 완료:`,
      playerWithColor.name,
    );
  };

  // 3. (옵션) 가차 리스트 생성 시에도 색상을 미리 넣어두고 싶다면 openGacha 수정
  const openGacha = (category, n) => {
    const slotKey = category + n; // 예: 'DF1', 'MF2'

    // 1. 이미 선수가 있거나 해당 카테고리 데이터가 없으면 리턴
    // (category가 'DF', 'MF', 'FW'이므로 playerDb에 해당 키가 있는지 확인)
    if (squad.value[slotKey] || !playerDb.value[category]) return;

    currentPos.value = category;
    currentSlotKey.value = slotKey;

    // 2. 이미 해당 슬롯의 가챠 결과가 저장되어 있다면 그대로 사용
    if (currentGachaResults.value[slotKey]) {
      gachaOptions.value = currentGachaResults.value[slotKey];
    } else {
      // 3. 현재 스쿼드에 이미 들어있는 선수 ID 제외
      const takenIds = Object.values(squad.value)
        .filter((p) => p)
        .map((p) => p.id);

      // 4. 세분화된 포지션 상관없이 'MF' 그룹이면 MF 전체에서 추출
      const filteredPool = playerDb.value[category].filter(
        (p) => !takenIds.includes(p.id),
      );

      // 5. 랜덤하게 3명 뽑기
      const newOptions = [...filteredPool]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((p) => ({
          ...p,
          teamColor: teamColors[p.team] || "#ffffff",
        }));

      currentGachaResults.value[slotKey] = newOptions;
      gachaOptions.value = newOptions;
    }
    isModalOpen.value = true;
  };

  // 5. 회원가입/로그인/저장 핵심 로직
  const handleRegister = async () => {
    try {
      const idRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{4,}$/;
      if (!idRegex.test(saveData.value.id)) {
        triggerToast("아이디는 영문과 숫자를 포함하여 4자 이상이어야 합니다.");
        return;
      }
      if (!saveData.value.nickname || saveData.value.nickname.length > 10) {
        triggerToast("닉네임은 10자 이내로 입력해주세요.");
        return;
      }
      if (saveData.value.pw !== saveData.value.pwConfirm) {
        triggerToast("비밀번호가 일치하지 않습니다!");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        `${saveData.value.id}@test.com`,
        saveData.value.pw,
      );

      await updateProfile(userCredential.user, {
        displayName: saveData.value.nickname,
      });

      triggerToast("회원가입 성공!");
      // onAuthStateChanged가 모달을 닫고 데이터를 처리하므로
      // 여기서는 성공 메시지만 띄우고 지연 후 저장을 시도합니다.
      setTimeout(() => {
        submitSave();
      }, 600);
    } catch (e) {
      if (e.code === "auth/email-already-in-use")
        triggerToast("이미 존재하는 아이디입니다.");
      else triggerToast("가입 실패: " + e.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        `${saveData.value.id}@test.com`,
        saveData.value.pw,
      );
      triggerToast("반가워요!");
      // 로그인 시 onAuthStateChanged가 loadUserSquad를 실행합니다.
    } catch (e) {
      triggerToast("로그인 정보를 확인하세요.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      isLoggedIn.value = false;
      isSaved.value = false;
      squad.value = {};
      triggerToast("로그아웃 되었습니다.");
    } catch (error) {
      console.error(error);
    }
  };

  const submitSave = async () => {
    const currentPickedCount = Object.keys(squad.value).length;
    if (currentPickedCount < 11) {
      triggerToast(`모든 선수 카드를 뽑은 후 저장이 가능합니다.`);
      return;
    }

    if (!isLoggedIn.value || !auth.currentUser) {
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
      isSaved.value = true;
      triggerToast("성공적으로 저장되었습니다!");
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserSquad = async (uid) => {
    if (!uid) return;
    try {
      const userRef = dbRef(database, `users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.squad) {
          squad.value = data.squad;
          isSaved.value = true;
        }
      }
    } catch (error) {
      console.error("로드 실패:", error);
    }
  };
  const handleImageError = (e) => {
    // 🚑 이미지를 찾을 수 없을 때 'unknown_player.png'로 교체
    e.target.src = "/images/unknown_player.png";
  };

  // 1. 평균 OVR 계산 (p.ovr -> p.stat 으로 수정)
  const averageOvr = computed(() => {
    const players = Object.values(squad.value);
    if (players.length === 0) return 0;

    // 데이터 키값이 'stat'이므로 p.stat을 더합니다.
    const total = players.reduce((sum, p) => sum + (Number(p.stat) || 0), 0);
    return Math.round(total / players.length);
  });

  // 2. 팀 컬러 계산 (소속팀 키값이 'team'인지 'club'인지 확인 필요!)
  const teamColorInfo = computed(() => {
    const players = Object.values(squad.value);
    if (players.length === 0)
      return { name: "없음", level: 0, buff: 0, count: 0 };

    const counts = {};
    players.forEach((p) => {
      // 💡 만약 팀 이름 키값이 'team'이 아니라면 이 부분을 p.club 등으로 고치세요.
      const teamName = p.team || p.club;
      if (teamName) {
        counts[teamName] = (counts[teamName] || 0) + 1;
      }
    });

    let mainTeam = "없음";
    let maxCount = 0;
    for (const team in counts) {
      if (counts[team] > maxCount) {
        maxCount = counts[team];
        mainTeam = team;
      }
    }

    let level = 0,
      buff = 0;
    if (maxCount >= 9) {
      level = 3;
      buff = 5;
    } else if (maxCount >= 6) {
      level = 2;
      buff = 3;
    } else if (maxCount >= 3) {
      level = 1;
      buff = 2;
    }

    return { name: mainTeam, level, buff, count: maxCount };
  });

  const formation = ref({
    name: "4-3-3",
    fw: 3,
    wm: 0,
    cm: 3,
    df: 4,
  });

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
    triggerToast,
    openLoginModal,
    openRegisterModal,
    handleRegister,
    handleLogin,
    handleLogout,
    submitSave,
    handleImageError,
    averageOvr,
    teamColorInfo,
    squad,
    formation,
  };
}
