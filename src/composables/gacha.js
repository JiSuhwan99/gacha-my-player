import { ref, onMounted, computed, watch } from "vue"; // computed 추가
import { auth, database } from "../firebase.js";
import { ref as dbRef, set, get, child } from "firebase/database";
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

  
const formationPresets = {
    "4-3-3": ["WF", "ST", "WF", "CM", "CM", "CM", "LB", "CB", "CB", "RB", "GK"],
    "4-4-2": ["ST", "ST", "WM", "CM", "CM", "WM", "LB", "CB", "CB", "RB", "GK"],
    "4-2-3-1": ["ST", "WM", "DM", "AM", "DM", "WM", "LB", "CB", "CB", "RB", "GK"],
    "3-5-2": [
      "ST",
      "ST",
      "CM",
      "CM",
      "CM",
      "LWB",
      "CB",
      "CB",
      "CB",
      "RWB",
      "GK",
    ],
    "5-4-1": [
      "ST",
      "WM",
      "CM",
      "CM",
      "WM",
      "LWB",
      "CB",
      "CB",
      "CB",
      "RWB",
      "GK",
    ],
  };

const formation = ref({
    name: "4-3-3",
    activeSlots: formationPresets["4-3-3"],
});

  const isReadyToShowField = ref(false); 
  const hasTeam = ref(false);
  const showToast = ref(false);
  const toastMessage = ref("");

  // 2. 초기화 및 로그인 감시
  onMounted(async () => {
    // 1. 로그인 상태 확인 (예: 토큰 존재 여부)
    const token = localStorage.getItem('user_token');
    isLoggedIn.value = !!token;
    hasTeam.value = Object.keys(squad.value).length > 0;

    // 3. 둘 다 만족할 때만 필드를 보여줌
    if (isLoggedIn.value && hasTeam.value) {
      isReadyToShowField.value = true;
    } else {
      hasTeam.value = false;
      formation.value = {
        name: '4-3-3',
        activeSlots: [
          'WF', 'ST', 'WF',          // 공격수 (row 1)
          'CM', 'CM', 'CM',        // 미드필더 (row 2)
          'LB', 'CB', 'CB', 'RB',   // 수비수 (row 3)
          'GK'                      // 키퍼 (row 4)
        ]
      };
    }
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
        isReadyToShowField.value = true; 
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
    // 1. [유지] 슬롯 키 체크 (절대 빼먹으면 안 됨)
    if (!currentSlotKey.value) {
      console.error("슬롯 키가 없습니다!");
      triggerToast("오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    // 2. [유지/강화] 새로운 선수 객체 생성
    // 이미지 경로와 팀 컬러를 여기서 확정지어 저장합니다.
    const playerWithColor = {
      ...player,
      image: player.image || `/images/${player.id}.png`,
      teamColor: teamColors[player.team] || "#ffffff",
    };

    // 3. [핵심 수정] 이제 squad.value['ST'] = 선수객체 형식으로 저장됩니다.
    // 이전에 'DF1' 같은 번호가 붙었다면, 이제는 currentSlotKey가 'ST', 'LB' 그 자체가 됩니다.
    squad.value[currentSlotKey.value] = playerWithColor;

    // 4. [유지] 해당 슬롯의 가챠 임시 데이터 삭제 (리롤 방지 및 데이터 정리)
    if (currentGachaResults.value[currentSlotKey.value]) {
      delete currentGachaResults.value[currentSlotKey.value];
    }

    // 5. [유지] 모달 닫기 및 상태 초기화
    isModalOpen.value = false;
    gachaOptions.value = [];
    isSaved.value = false; // 데이터가 변했으므로 '저장 안 됨' 상태로 변경

    console.log(
      `[배치 완료] 슬롯: ${currentSlotKey.value}, 선수: ${playerWithColor.name}`,
    );
  };

  const getPrioritizedPool = (pos, takenIds, allPlayers) => {
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    // 1. 오직 메인 포지션이 정확히 일치하는 선수만 필터링
    const mainMatch = allPlayers.filter(
      (p) => p.mainPosition === pos && !takenIds.includes(p.id),
    );

    // 2. 섞기
    const shuffledPool = shuffle(mainMatch);

    console.log(`[가챠 생성] ${pos} 전용 풀 개수: ${shuffledPool.length}`);
    return shuffledPool.slice(0, 3);
  };

  // 4. 메인 가챠 함수
  const openGacha = (pos, i) => {
    // i가 undefined일 경우를 대비해 기본값 처리
    const index = i !== undefined ? i : "";
    const slotKey = pos + index;

    if (squad.value[slotKey]) return;

    currentPos.value = pos;
    currentSlotKey.value = slotKey;

    // 리롤 방지: 이미 뽑아둔 결과가 있다면 재사용
    if (currentGachaResults.value[slotKey]) {
      gachaOptions.value = currentGachaResults.value[slotKey];
      isModalOpen.value = true;
      return;
    }

    const takenIds = Object.values(squad.value)
      .filter((p) => p)
      .map((p) => p.id);
    const allPlayers = Object.values(playerDb.value).flat();

    // 선수 풀 구성
    let pool = getPrioritizedPool(pos, takenIds, allPlayers);

    // ✅ 에러 지점 수정: results 변수를 명확히 선언함
    const results = pool.slice(0, 3).map((p) => ({
      ...p,
      teamColor: teamColors[p.team] || "#ffffff",
    }));

    // 결과 저장 및 출력
    currentGachaResults.value[slotKey] = results;
    gachaOptions.value = results;
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
        isReadyToShowField.value = true;
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
      isReadyToShowField.value = false; 
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

      // ✅ 선수 ID만 추출
      const squadIdsOnly = {};
      Object.entries(squad.value).forEach(([slotKey, player]) => {
        if (player) squadIdsOnly[slotKey] = player.id;
      });

      await set(userRef, {
        nickname: user.displayName || "익명",
        squad: squadIdsOnly,
        formation: formation.value.name, // ✅ 현재 포메이션 이름 저장 (예: "3-5-2")
        updatedAt: Date.now(),
      });

      isSaved.value = true;
      triggerToast("포메이션과 스쿼드가 저장되었습니다!");
    } catch (e) {
      console.error(e);
      triggerToast("저장 중 오류가 발생했습니다.");
    }
  };

  const loadUserSquad = async (uid) => {
    if (!uid) return;
    try {
      const userRef = dbRef(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        // 1. ✅ 저장된 포메이션이 있다면 먼저 적용
        if (data.formation && formationPresets[data.formation]) {
          formation.value = {
            name: data.formation,
            activeSlots: [...formationPresets[data.formation]],
          };
        }

        // 2. ✅ ID를 바탕으로 선수 데이터 복구
        if (data.squad) {
          const loadedSquad = {};
          const allPlayers = Object.values(playerDb.value).flat();

          Object.entries(data.squad).forEach(([slotKey, playerId]) => {
            const playerInfo = allPlayers.find((p) => p.id === playerId);
            if (playerInfo) {
              loadedSquad[slotKey] = {
                ...playerInfo,
                image: `/images/${playerInfo.id}.png`,
                teamColor: teamColors[playerInfo.team] || "#ffffff",
              };
            }
          });

          squad.value = loadedSquad;
          isSaved.value = true;
        }
      }
    } catch (error) {
      console.error("로드 실패:", error);
    }
  };

  const handleImageError = (e) => {
  // 1. 중복 실행 방지 (이게 핵심입니다!)
  e.target.onerror = null; 

  // 2. 대체 이미지 경로 확인
  // 경로가 '/images/...' 인지 'public/images/...' 인지 프로젝트 구조에 맞춰 확인하세요.
  e.target.src = "/images/unknown_player.png";

  // 3. (디버깅용) 콘솔에 에러가 떴는지 확인
  console.log("이미지 로드 실패: 기본 이미지로 대체합니다.");
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

  // const formationPresets = {
  //   "4-3-3": ["WF", "ST", "WF", "CM", "CM", "CM", "LB", "CB", "CB", "RB", "GK"],
  //   "4-4-2": ["ST", "ST", "WM", "CM", "CM", "WM", "LB", "CB", "CB", "RB", "GK"],
  //   "3-5-2": [
  //     "ST",
  //     "ST",
  //     "CM",
  //     "CM",
  //     "CM",
  //     "LWB",
  //     "CB",
  //     "CB",
  //     "CB",
  //     "RWB",
  //     "GK",
  //   ],
  // };

  // const formation = ref({
  //   name: "4-3-3",
  //   activeSlots: formationPresets["4-3-3"],
  // });

  const getCategory = (pos) => {
    if (["ST", "WF", "CF", "WF"].includes(pos)) return "FW";
    if (["CM", "DM", "AM", "WM"].includes(pos)) return "MF";
    if (["LB", "RB", "CB", "LWB", "RWB"].includes(pos)) return "DF";
    if (pos === "GK") return "GK";
    return "ETC";
  };

  const changeFormation = (type) => {
    const newSlots = formationPresets[type];
    if (!newSlots) return;

    // 1. 현재 필드에 있는 11명의 선수 백업
    const confirmedPlayers = Object.values(squad.value).filter(
      (p) => p !== null,
    );

    // 2. 포메이션 정보 업데이트
    formation.value = {
      name: type,
      activeSlots: [...newSlots],
    };

    // 3. 스쿼드 초기화 (새 인덱스 배정 준비)
    squad.value = {};

    // 4. [1단계 이사] 자기 카테고리(FW, MF, DF 등)에 맞는 자리 찾기
    const unplacedPlayers = []; // 카테고리 자리가 없어 못 들어간 선수들 보관함

    confirmedPlayers.forEach((player) => {
      const playerCat = getCategory(player.mainPosition);

      // 같은 카테고리이면서 비어있는 자리 찾기
      const targetIndex = newSlots.findIndex(
        (pos, idx) => getCategory(pos) === playerCat && !squad.value[pos + idx],
      );

      if (targetIndex !== -1) {
        const newKey = newSlots[targetIndex] + targetIndex;
        squad.value[newKey] = player;
      } else {
        // 카테고리 자리가 없으면 일단 보관함으로
        unplacedPlayers.push(player);
      }
    });

    // 5. [2단계 이사] 카테고리 자리가 없는 선수들을 남는 "아무 자리"에나 배치
    unplacedPlayers.forEach((player) => {
      // 포지션/카테고리 상관없이 그냥 비어있는 첫 번째 자리 찾기
      const targetIndex = newSlots.findIndex(
        (pos, idx) => !squad.value[pos + idx],
      );

      if (targetIndex !== -1) {
        const newKey = newSlots[targetIndex] + targetIndex;
        squad.value[newKey] = player;
      }
    });

    console.log(
      `[이사 완료] ${type} 포메이션 재배치 (카테고리 우선 + 잔여석 배치)`,
    );
  };

  const swapPlayers = (fromKey, toKey) => {
    if (!fromKey || !toKey || fromKey === toKey) return;

    const temp = squad.value[fromKey];
    squad.value[fromKey] = squad.value[toKey];
    squad.value[toKey] = temp;

    isSaved.value = false; // 위치가 바뀌었으니 저장 필요 상태로 변경
    console.log(`${fromKey}와 ${toKey}의 위치를 바꿨습니다.`);
  };

const onDragEnter = (slotKey) => {
  dragOverSlotKey.value = slotKey;
};

const onDragLeave = () => {
  dragOverSlotKey.value = null;
};

  // 드래그 상태 관리
  const draggedSlotKey = ref(null);

  const onDragStart = (e, slotKey) => {
    draggedSlotKey.value = slotKey;

    if (e.dataTransfer) {
      // 빈 이미지를 생성해서 드래그 잔상을 아예 없애버립니다.
      const img = new Image();
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      e.dataTransfer.setDragImage(img, 0, 0);

      e.dataTransfer.effectAllowed = "move";
    }
  };
  const onDrop = (targetSlotKey) => {
    swapPlayers(draggedSlotKey.value, targetSlotKey);
    draggedSlotKey.value = null;
    dragOverSlotKey.value = null;
  };

  const formationRows = computed(() => {
  const rows = {
    fw: [],
    mf: [],
    df: [],
    gk: []
  };

  // 11개의 슬롯을 돌면서 카테고리별로 분류
  formation.value.activeSlots.forEach((pos, i) => {
    const category = getCategory(pos).toLowerCase();
    rows[category].push({
      pos,
      index: i,
      slotKey: pos + i
    });
  });

  // 축구장 위에서부터 보여줄 순서대로 배열 반환 (FW -> MF -> DF -> GK)
  return [rows.fw, rows.mf, rows.df, rows.gk];
});

const dragOverSlotKey = ref(null);

const selectedPlayerForView = ref(null); // 크게 볼 선수 데이터
const showDetailModal = ref(false);      // 모달 표시 여부

const openPlayerDetail = (e, player) => {
  if (!player) return;
  e.preventDefault(); // ✅ 브라우저 기본 우클릭 메뉴 차단
  
  selectedPlayerForView.value = player;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
};

const isMenuOpen = ref(false);

// 포메이션 선택 시 메뉴를 닫아주는 함수
const selectAndClose = (name) => {
  if (typeof changeFormation === 'function') {
    changeFormation(name); // 기존에 만드신 포메이션 변경 함수 호출
  }
  isMenuOpen.value = false; // 메뉴 닫기
};

const isTopMenuOpen = ref(false);

const topSelectAndClose = (name) => {
  // 1. 포메이션 변경 로직 실행
  changeFormation(name); 
  // 2. 메뉴 닫기
  isMenuOpen.value = false;
};



// 현재 보고 있는 화면 상태 ('field', 'storage', 'shop' 등)
const currentView = ref('field'); 

// 보관함 열기
const goToStorage = () => {
  currentView.value = 'storage';
  isMenuOpen.value = false; // 열려있던 메뉴는 닫기
};

// 메인(필드)으로 돌아가기
const goToField = () => {
  currentView.value = 'field';
};

const playerInventory = ref([]);

// [핵심] 보관함으로 화면이 전환될 때 실행
watch(() => currentView.value, async (newView) => {
  if (newView === 'storage') {
    await fetchUserInventory();
  }
});

const fetchUserInventory = async () => {
  const user = auth.currentUser;
  if (!user) return;

  // Realtime Database의 경로 설정
  // 예: users/사용자UID/database 에 선수들이 저장되어 있다고 가정
  const userDbRef = dbRef(db);
  
  try {
    const snapshot = await get(child(userDbRef, `users/${user.uid}/database`));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Realtime DB는 객체 형태로 오기 때문에 배열로 변환해줘야 v-for가 돌아갑니다.
      const players = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));

      playerInventory.value = players;
      console.log("Realtime DB 로드 완료:", players.length);
    } else {
      playerInventory.value = [];
      console.log("저장된 선수 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("Realtime DB 읽기 에러:", error);
  }
};
  return {
    etchUserInventory,
    child,
    currentView,
    goToStorage,
    goToField,
    isTopMenuOpen,
    topSelectAndClose,
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
    formationPresets,
    changeFormation,
    getCategory,
    onDragStart, // 드래그 시작 함수
    onDrop, // 드래그 종료(교체) 함수
    draggedSlotKey,
    onDragEnter,
    onDragLeave,
    formationRows,
    dragOverSlotKey,
    isReadyToShowField,
    selectedPlayerForView,
    showDetailModal,
    openPlayerDetail,
    closeDetailModal,
    isMenuOpen,
    selectAndClose,
    playerInventory,
  };
}
