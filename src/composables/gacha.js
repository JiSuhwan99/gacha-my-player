import { ref, onMounted, computed, watch } from "vue";
import { auth, database } from "../firebase.js";
import { runTransaction, ref as dbRef, set, get, onValue, update, remove } from "firebase/database";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut,
} from "firebase/auth";

export function useGacha() {
  /** -----------------------------
   *  State: core
   --------------------------------*/
  const squad = ref({});
  const isReleaseModalOpen = ref(false);
  const playerDb = ref(null); // null = 아직 로드 안됨
  const isModalOpen = ref(false);
  const modalType = ref(null);
  const isLoggedIn = ref(false);
  const isSaved = ref(false);
  const authMode = ref("login");
  const currentPos = ref("");
  const currentSlotKey = ref("");
  const gachaOptions = ref([]);
  const currentGachaResults = ref({});
  const isReadyToShowField = ref(false);
  const showToast = ref(false);
  const toastMessage = ref("");
  const draggedSlotKey = ref(null);
  const dragOverSlotKey = ref(null);
  const selectedPlayerForView = ref(null);
  const isMenuOpen = ref(false);
  const isTopMenuOpen = ref(false);
  const VIEW_KEY = "gacha_current_view";
  const currentView = ref(localStorage.getItem(VIEW_KEY) || "field");
  const displayName = ref("");
  const userGold = ref(0);
  const playerInventory = ref([]);
  const searchQuery = ref("");
  const sortType = ref("recent");
  const selectedPlayers = ref([]);
  const saveData = ref({
    id: "",
    nickname: "",
    pw: "",
    pwConfirm: "",
  });

  const teamColors = {
    "Team Tiger": "team-tiger",
    "Blue Dragon": "blue-dragon",
    "Red Phoenix": "red-phoenix",
    "Silver Wolf": "silver-wolf",
    "Golden Eagle": "golden-eagles",
  };

  const formationPresets = {
    "4-3-3": ["WF", "ST", "WF", "CM", "CM", "CM", "LB", "CB", "CB", "RB", "GK"],
    "4-4-2": ["ST", "ST", "WM", "CM", "CM", "WM", "LB", "CB", "CB", "RB", "GK"],
    "4-2-3-1": ["ST", "WM", "DM", "AM", "DM", "WM", "LB", "CB", "CB", "RB", "GK"],
    "3-5-2": ["ST", "ST", "CM", "CM", "CM", "LWB", "CB", "CB", "CB", "RWB", "GK"],
    "5-4-1": ["ST", "WM", "CM", "CM", "WM", "LWB", "CB", "CB", "CB", "RWB", "GK"],
  };

  const formation = ref({
    name: "4-3-3",
    activeSlots: formationPresets["4-3-3"],
  });
  const isLocked = (player) => {
    return !!player.locked;
  };
  const squadCount = computed(() => {
    return Object.values(squad.value).filter(Boolean).length;
  });

  const canReleasePlayer = computed(() => {
    return squadCount.value > 11;
  });

  const isInSquad = (playerId) => {
    return Object.values(squad.value).some(
      (p) => p && p.id === playerId
    );
  };

  /** -----------------------------
   *  Utils
   --------------------------------*/
  const triggerToast = (msg) => {
    toastMessage.value = msg;
    showToast.value = true;
    setTimeout(() => (showToast.value = false), 2000);
  };

  const ensurePlayerDbLoaded = async () => {
    if (playerDb.value) return;
    try {
      const res = await fetch("/playersDb.json");
      playerDb.value = await res.json();
    } catch (e) {
      console.error("데이터 로드 실패", e);
      playerDb.value = {}; // fallback
    }
  };

  const getAllPlayersFlat = () => {
    if (!playerDb.value) return [];
    const raw = playerDb.value;
    if (Array.isArray(raw)) return raw.flat();
    return Object.values(raw).flat();
  };

  const makePlayerEntity = (player) => ({
    ...player,
    image: player.image || `/images/${player.id}.png`,
    teamColor: teamColors[player.team],
  });

  const handleImageError = (e) => {
    if (!e?.target) return;
    e.target.onerror = null;
    e.target.src = "/images/unknown_player.png";
  };

  /** -----------------------------
   *  Category / Formation helpers
   --------------------------------*/
  const getCategory = (pos) => {
    if (["ST", "WF", "CF"].includes(pos)) return "FW";
    if (["CM", "DM", "AM", "WM"].includes(pos)) return "MF";
    if (["LB", "RB", "CB", "LWB", "RWB"].includes(pos)) return "DF";
    if (pos === "GK") return "GK";
    return "ETC";
  };

  const formationRows = computed(() => {
    const rows = { fw: [], mf: [], df: [], gk: [] };

    formation.value.activeSlots.forEach((pos, i) => {
      const category = getCategory(pos).toLowerCase();
      rows[category].push({ pos, index: i, slotKey: pos + i });
    });

    return [rows.fw, rows.mf, rows.df, rows.gk];
  });

  /** -----------------------------
   *  Derived stats
   --------------------------------*/
  const averageOvr = computed(() => {
    const players = Object.values(squad.value).filter(Boolean);
    if (players.length === 0) return 0;
    const total = players.reduce((sum, p) => sum + (Number(p.stat) || 0), 0);
    return Math.round(total / players.length);
  });

  const teamColorInfo = computed(() => {
    const players = Object.values(squad.value).filter(Boolean);
    if (players.length === 0) return { name: "없음", level: 0, buff: 0, count: 0 };

    const counts = {};
    players.forEach((p) => {
      const teamName = p.team || p.club;
      if (teamName) counts[teamName] = (counts[teamName] || 0) + 1;
    });

    let mainTeam = "없음";
    let maxCount = 0;
    for (const team in counts) {
      if (counts[team] > maxCount) {
        maxCount = counts[team];
        mainTeam = team;
      }
    }

    let level = 0, buff = 0;
    if (maxCount >= 9) { level = 3; buff = 5; }
    else if (maxCount >= 6) { level = 2; buff = 3; }
    else if (maxCount >= 3) { level = 1; buff = 2; }

    return { name: mainTeam, level, buff, count: maxCount };
  });

  /** -----------------------------
   *  Auth modal controls
   --------------------------------*/
  const openModal = (type) => {
    modalType.value = type;
    isModalOpen.value = true;
  };

  const closeModal = () => {
    isModalOpen.value = false;
    modalType.value = null;
  };

  const openLoginModal = () => {
    authMode.value = "login";
    saveData.value = { id: "", nickname: "", pw: "", pwConfirm: "" };
    openModal("auth");
  };

  const openRegisterModal = () => {
    authMode.value = "register";
    saveData.value = { id: "", nickname: "", pw: "", pwConfirm: "" };
    openModal("auth");
  };
  const openPlayerDetail = (e, player) => {
    if (!player) return;
    selectedPlayerForView.value = player;
    openModal("detail")
  };
  const openStorageModal = () => {
    authMode.value = "storage";
    openModal("storage");
  };

  /** -----------------------------
   *  Gacha
   --------------------------------*/
  const getPrioritizedPool = (pos, takenIds, allPlayers) => {
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const mainMatch = allPlayers.filter(
      (p) => p.mainPosition === pos && !takenIds.includes(p.id)
    );
    return shuffle(mainMatch).slice(0, 3);
  };

  // ✅ async로 변경: playerDb 로드 전에 눌러도 안전
  const openGacha = async (pos, i = "") => {
    await ensurePlayerDbLoaded();

    const slotKey = pos + i;
    if (squad.value[slotKey]) return;

    currentPos.value = pos;
    currentSlotKey.value = slotKey;

    // 리롤 방지: 이미 결과가 있으면 재사용
    if (currentGachaResults.value[slotKey]) {
      gachaOptions.value = currentGachaResults.value[slotKey];
      openModal("gacha");
      return;
    }

    const takenIds = Object.values(squad.value).filter(Boolean).map((p) => p.id);
    const allPlayers = getAllPlayersFlat();

    const pool = getPrioritizedPool(pos, takenIds, allPlayers);
    const results = pool.map((p) => makePlayerEntity(p));

    currentGachaResults.value[slotKey] = results;
    gachaOptions.value = results;
    openModal("gacha");
  };

  const selectPlayer = (player) => {
    if (!currentSlotKey.value) {
      triggerToast("오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    squad.value[currentSlotKey.value] = makePlayerEntity(player);

    // 리롤 데이터 제거
    delete currentGachaResults.value[currentSlotKey.value];

    closeModal();
    gachaOptions.value = [];
    isSaved.value = false;
  };

  /** -----------------------------
   *  Drag & Drop
   --------------------------------*/
  const swapPlayers = (fromKey, toKey) => {
    if (!fromKey || !toKey || fromKey === toKey) return;
    const temp = squad.value[fromKey];
    squad.value[fromKey] = squad.value[toKey];
    squad.value[toKey] = temp;
    isSaved.value = false;
  };

  const onDragStart = (e, slotKey) => {
    draggedSlotKey.value = slotKey;

    if (e?.dataTransfer) {
      const img = new Image();
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      e.dataTransfer.setDragImage(img, 0, 0);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const onDragEnter = (slotKey) => (dragOverSlotKey.value = slotKey);
  const onDragLeave = () => (dragOverSlotKey.value = null);
  const onDrop = (targetSlotKey) => {
    swapPlayers(draggedSlotKey.value, targetSlotKey);
    draggedSlotKey.value = null;
    dragOverSlotKey.value = null;
  };

  /** -----------------------------
   *  Formation
   --------------------------------*/
  const changeFormation = (type) => {
    const currentPlayers = Object.values(squad.value || {}).filter(Boolean);
    const playerCount = currentPlayers.length;

    // ✅ 규칙 1) 비로그인: 카드 0장일 때만 변경 가능
    if (!isLoggedIn.value) {
      if (playerCount !== 0) {
        triggerToast("선수를 뽑은 후에는 포메이션을 변경할 수 없어요!");
        return;
      }
    }

    // ✅ 규칙 2) 로그인: 카드 11장일 때만 변경 가능
    if (isLoggedIn.value) {
      if (playerCount !== 11) {
        triggerToast("11명의 선수를 모두 보유한 상태에서만 포메이션 변경이 가능해요!");
        return;
      }
    }

    const newSlots = formationPresets[type];
    if (!newSlots) return;

    // 1) 포메이션 변경
    formation.value = { name: type, activeSlots: [...newSlots] };

    // 2) 게스트(0장)면 그냥 비워둔 상태로 끝
    if (playerCount === 0) {
      squad.value = {};
      currentGachaResults.value = {};
      isSaved.value = false;
      return;
    }

    // 3) 로그인(11장) 재배치 시작
    //    - 기존 선수 11명을 새 슬롯에 재배치
    const newSquad = {};
    const usedIndex = new Set();

    // 슬롯 인덱스별 "카테고리" 미리 계산
    const slotCategories = newSlots.map((pos) => getCategory(pos)); // ['FW','FW',...]
    const slotKeys = newSlots.map((pos, idx) => `${pos}${idx}`);

    // 선수의 기준 포지션 결정 (displayPos > mainPosition > pos)
    const getPlayerPos = (p) => p.displayPos || p.mainPosition || p.pos;

    // 1차: 카테고리 매칭(FW/MF/DF/GK) 우선 배치
    const unplaced = [];

    currentPlayers.forEach((player) => {
      const pPos = getPlayerPos(player);
      const pCat = getCategory(pPos);

      // 같은 카테고리면서 아직 비어있는 슬롯 찾기
      const targetIdx = slotCategories.findIndex((cat, idx) => {
        if (usedIndex.has(idx)) return false;
        return cat === pCat;
      });

      if (targetIdx !== -1) {
        usedIndex.add(targetIdx);
        newSquad[slotKeys[targetIdx]] = player; // 선수 객체 그대로 유지
      } else {
        unplaced.push(player);
      }
    });

    // 2차: 남은 선수들은 남는 슬롯 아무데나 채우기
    unplaced.forEach((player) => {
      const targetIdx = slotKeys.findIndex((_, idx) => !usedIndex.has(idx));
      if (targetIdx === -1) return; // 이론상 11명/11칸이면 여기 안 옴
      usedIndex.add(targetIdx);
      newSquad[slotKeys[targetIdx]] = player;
    });

    // 4) 반영 + 리롤 데이터는 포메이션 바뀌면 무효 처리
    squad.value = newSquad;
    currentGachaResults.value = {}; // ✅ 중요: 이전 포메이션의 slotKey 결과는 폐기
    isSaved.value = false; // ✅ 포메이션 변경 = 저장 필요 상태
  };


  const selectAndClose = (name) => {
    changeFormation(name);
    isMenuOpen.value = false;
  };

  /** -----------------------------
   *  Firebase: gold watch
   --------------------------------*/
  let goldUnsubscribe = null;

  const watchUserGold = (uid) => {
    if (!uid) return;

    // ✅ 중복 리스너 방지
    if (goldUnsubscribe) goldUnsubscribe();

    const goldRef = dbRef(database, `users/${uid}/gold`);
    goldUnsubscribe = onValue(goldRef, (snapshot) => {
      userGold.value = snapshot.val() ?? 0;
    });
  };

  /** -----------------------------
   *  Firebase: save/load
   --------------------------------*/
  const buildTeamPayload = () => {
    const squadIdsOnly = {};
    const inventoryData = {};

    Object.entries(squad.value).forEach(([slotKey, player]) => {
      if (!player) return;
      squadIdsOnly[slotKey] = player.id;

      inventoryData[player.id] = {
        id: player.id,
        pos: player.mainPosition,
        locked: false,
        updatedAt: Date.now(),
      };
    });

    return {
      squad: squadIdsOnly,
      inventory: inventoryData,
      formation: formation.value.name,
      teamUpdatedAt: Date.now(),
    };
  };

  const persistTeamToDb = async ({ mode = "update", silent = false } = {}) => {
    const picked = Object.keys(squad.value || {}).length;

    // 팀 저장은 11명 필수 (너 규칙 유지)
    if (picked < 11) {
      return { ok: false, reason: "NOT_FULL" };
    }

    if (!isLoggedIn.value || !auth?.currentUser) {
      if (!silent) {
        authMode.value = "register"; // ✅ 여기!
        openModal("auth");
      }
      return { ok: false, reason: "NOT_LOGGED_IN" };
    }
    const user = auth.currentUser;
    const userRef = dbRef(database, `users/${user.uid}`);

    try {
      const payload = buildTeamPayload();

      if (mode === "initial") {
        await update(userRef, {
          nickname: user.displayName || "익명",
          gold: userGold.value ?? 0,
          teamCreatedAt: Date.now(),
          ...payload,
        });
      } else {
        await update(userRef, payload);
      }

      isSaved.value = true;

      if (!silent && !isLoggedIn.value) triggerToast("저장 완료");

      return { ok: true };
    } catch (e) {
      if (!silent) triggerToast("저장 중 오류가 발생했습니다.");
      return { ok: false, reason: "DB_ERROR" };
    }
  };

  const saveTeamInitial = async (opts = {}) => {
    return await persistTeamToDb({ mode: "initial", ...opts });
  };

  const saveTeamUpdate = async (opts = {}) => {
    return await persistTeamToDb({ mode: "update", ...opts });
  };

  const loadUserSquad = async (uid) => {
    if (!uid) return;

    await ensurePlayerDbLoaded();

    try {
      const userRef = dbRef(database, `users/${uid}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) return;

      const data = snapshot.val();

      if (data.formation && formationPresets[data.formation]) {
        formation.value = {
          name: data.formation,
          activeSlots: [...formationPresets[data.formation]],
        };
      }

      if (data.squad) {
        const allPlayers = getAllPlayersFlat();
        const loadedSquad = {};

        Object.entries(data.squad).forEach(([slotKey, playerId]) => {
          const info = allPlayers.find((p) => String(p.id) === String(playerId));
          if (!info) return;
          loadedSquad[slotKey] = makePlayerEntity(info);
        });

        squad.value = loadedSquad;
        isSaved.value = true;
      }
    } catch (e) {
      console.error("로드 실패:", e);
    }
  };

  /** -----------------------------
   *  Firebase: inventory
   --------------------------------*/
  const fetchUserInventory = async () => {
    const user = auth?.currentUser;
    if (!user) return;

    await ensurePlayerDbLoaded();

    try {
      const allPlayerData = getAllPlayersFlat();
      const snapshot = await get(dbRef(database, `users/${user.uid}/inventory`));

      if (!snapshot.exists()) {
        playerInventory.value = [];
        return;
      }

      const inventoryMap = snapshot.val();
      const idList = Object.keys(inventoryMap);

      playerInventory.value = idList
        .map((dbId) => {
          const baseInfo = allPlayerData.find((p) => String(p.id) === String(dbId));
          if (!baseInfo) return null;

          const dbDetail = inventoryMap[dbId];
          return {
            ...baseInfo,
            displayPos: dbDetail.pos || baseInfo.pos,
            locked: !!dbDetail.locked,
            updatedAt: dbDetail.updatedAt,
          };
        })
        .filter(Boolean);
    } catch (e) {
      console.error("🔥 로드 중 에러:", e);
    }
  };

  const groupedByPosition = computed(() => {
    return filteredInventory.value.reduce((acc, player) => {
      const pos = player.displayPos || "ETC";

      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(player);

      return acc;
    }, {});
  });

  /** -----------------------------
   *  UI handlers
   --------------------------------*/

  const topSelectAndClose = (name) => {
    currentView.value = name;

    isMenuOpen.value = false;
    isTopMenuOpen.value = false;
  };

  const goToShop = () => {
    currentView.value = "shop";
    isMenuOpen.value = false;
  };
  const goToField = () => (currentView.value = "field");

  /** -----------------------------
   *  Auth actions
   --------------------------------*/
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
        saveData.value.pw
      );

      await updateProfile(userCredential.user, {
        displayName: saveData.value.nickname,
      });

      // 가입 축하금
      const uid = userCredential.user.uid;

      // ✅ 축하금 먼저
      await set(dbRef(database, `users/${uid}/gold`), 1000);
      isLoggedIn.value = true;
      displayName.value = saveData.value.nickname;

      // ✅ 회원가입 직후 자동 저장: 토스트/모달 없이
      const ok = await saveTeamInitial({ silent: true });
      if (ok.ok) {
        await loadUserSquad(uid);
        closeModal();
        triggerToast(displayName.value + "님 가입이 완료되었습니다!");
      }

    } catch (e) {
      if (e.code === "auth/email-already-in-use") triggerToast("이미 존재하는 아이디입니다.");
      else triggerToast("가입 실패: " + e.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        `${saveData.value.id}@test.com`,
        saveData.value.pw
      );
      triggerToast(displayName.value + "님 반가워요!");
      closeModal(); // ✅ 성공 시 모달 닫기
    } catch {
      triggerToast("로그인 정보를 확인하세요.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      triggerToast("로그아웃 되었습니다.");

      // ✅ UX 안정용 즉시 초기화 (auth 리스너에서도 다시 한번 정리됨)
      isLoggedIn.value = false;
      isSaved.value = false;
      isReadyToShowField.value = false;
      squad.value = {};
      displayName.value = "";
      userGold.value = 0;
      playerInventory.value = [];
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };
  const handleSaveClick = async () => {
    const picked = Object.keys(squad.value || {}).length;

    // 1) 먼저 11명 체크 → 토스트는 여기서 무조건 뜨게
    if (picked < 11) {
      triggerToast("모든 선수 카드를 뽑은 후 저장할 수 있어요");
      return;
    }

    // 2) 11명인데 비로그인 → auth 모달
    if (!isLoggedIn.value || !auth?.currentUser) {
      authMode.value = "register";     // 원하면 "login"으로
      openModal("auth");
      return;
    }

    // 3) 로그인 + 11명 → 실제 저장
    // 최초 저장/변경 저장 정책에 맞춰 호출
    await saveTeamUpdate({
      silent: true
    }); // 로그인일 때 토스트 안 뜨게
    triggerToast("스쿼드 저장이 완료되었습니다.");
  };

  /** -----------------------------
   *  Init (auth listener 1개)
   --------------------------------*/
  onMounted(async () => {
    await ensurePlayerDbLoaded();

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        displayName.value = "";
        isLoggedIn.value = false;
        isSaved.value = false;
        isReadyToShowField.value = false;
        squad.value = {};
        userGold.value = 0;
        playerInventory.value = [];
        return;
      }

      isLoggedIn.value = true;
      closeModal();
      isReadyToShowField.value = true;
      displayName.value = user.displayName || "";

      watchUserGold(user.uid);
      await loadUserSquad(user.uid);
    });
  });

  watch(
    () => modalType.value,
    async (newType, oldType) => {
      if (newType === "storage") {
        await fetchUserInventory();
      }
      if (oldType === "storage" && newType !== "storage") {
        clearInventorySelection();
      }
    }
  );
  watch(currentView, (v) => {
    localStorage.setItem(VIEW_KEY, v);
  });
  const POSITION_GROUP_MAP = {
    FW: ["ST", "CF", "WF"],
    MF: ["CM", "DM", "AM", "WM"],
    DF: ["CB", "LB", "RB", "LWB", "RWB"],
    GK: ["GK"],
  };


  const filteredInventory = computed(() => {
    let list = [...playerInventory.value];

    // 🔍 검색
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q)
      );
    }

    // ↕ 정렬
    switch (sortType.value) {
      case "stat":
        list.sort((a, b) => (b.stat ?? 0) - (a.stat ?? 0));
        break;

      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        break;

      case "recent":
      default:
        list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
        break;

      case "position":
        list.sort((a, b) =>
          a.displayPos.localeCompare(b.displayPos)
        );
        break;
    }

    return list;
  });


  const groupedByLine = computed(() => {
    const result = {
      FW: [],
      MF: [],
      DF: [],
      GK: [],
    };

    filteredInventory.value.forEach((player) => {
      const pos = player.displayPos || player.pos;

      const line = Object.keys(POSITION_GROUP_MAP).find((key) =>
        POSITION_GROUP_MAP[key].includes(pos)
      );

      if (line) {
        result[line].push(player);
      }
    });

    return result;
  });

  const visibleCount = computed(() => {
    if (sortType.value === "position") {
      // FW / MF / DF / GK 전부 합산
      return Object.values(groupedByLine.value)
        .flat()
        .length;
    }

    // 일반 정렬 / 검색 상태
    return filteredInventory.value.length;
  });

  const selectedInventoryIds = ref(new Set());

  const togglePlayerSelect = (playerId) => {
    const idx = selectedPlayers.value.indexOf(playerId);

    if (idx === -1) {
      selectedPlayers.value.push(playerId);
    } else {
      selectedPlayers.value.splice(idx, 1);
    }
  };


  const toggleInventorySelect = (player) => {
    if (!player) return;

    const id = player.id;
    const set = selectedInventoryIds.value;

    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }

    // Vue 반응성 보장
    selectedInventoryIds.value = new Set(set);
  };

  const releaseSelectedPlayers = async () => {
    const user = auth.currentUser;
    if (!user) {
      triggerToast("로그인이 필요합니다.");
      return;
    }

    // 선택 없음
    if (!selectedPlayers.value?.length) {
      triggerToast("방출할 선수를 선택해주세요.");
      return;
    }

    // ✅ 스쿼드 포함 선수는 제외
    const releasableIds = selectedPlayers.value.filter((id) => !isInSquad(id));

    // 전부 스쿼드 선수만 선택한 경우
    if (!releasableIds.length) {
      triggerToast("주전 선수는 방출할 수 없습니다.");
      closeReleaseModal();
      return;
    }

    try {
      // DB 삭제
      await Promise.all(
        releasableIds.map((id) =>
          remove(dbRef(database, `users/${user.uid}/inventory/${id}`))
        )
      );

      // 로컬 목록 갱신
      playerInventory.value = playerInventory.value.filter(
        (p) => !releasableIds.includes(p.id)
      );

      // 선택 초기화
      selectedPlayers.value = [];

      triggerToast(`${releasableIds.length}명 방출 완료`);
      closeReleaseModal();
    } catch (e) {
      console.error("❌ 방출 실패:", e);
      triggerToast("방출 중 오류가 발생했습니다.");
      closeReleaseModal();
    }
  };



  const openReleaseModal = () => {
    isReleaseModalOpen.value = true;
  };

  const closeReleaseModal = () => {
    isReleaseModalOpen.value = false;
    clearSelectedPlayers();
  };

  const confirmRelease = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!selectedPlayers.value.length) {
      triggerToast("방출할 선수를 선택해주세요.");
      return;
    }

    // ✅ 방출 가능한 선수만 필터
    const releasableIds = selectedPlayers.value.filter(
      (id) => !isInSquad(id)
    );

    if (!releasableIds.length) {
      triggerToast("주전 선수는 방출할 수 없습니다.");
      clearSelectedPlayers();
      closeReleaseModal();
      return;
    }

    try {
      await Promise.all(
        releasableIds.map((id) =>
          remove(dbRef(database, `users/${user.uid}/inventory/${id}`))
        )
      );

      // 로컬 인벤토리 갱신
      playerInventory.value = playerInventory.value.filter(
        (p) => !releasableIds.includes(p.id)
      );

      triggerToast(`${releasableIds.length}명 방출 완료`);

      closeReleaseModal();
    } catch (e) {
      console.error(e);
      triggerToast("방출 중 오류가 발생했습니다.");
    } finally {
      clearSelectedPlayers();
      closeReleaseModal();
    }
  };

  const clearInventorySelection = () => {
    selectedInventoryIds.value = [];
  };
  const squadPlayerList = computed(() => {
    return Object.values(squad.value).filter(Boolean);
  });
  const cardPacks = [
    {
      id: "gold",
      title: "골드 선수팩",
      price: 1000,
      stars: 4,
      themeClass: "gold-pack",
      grade: "GOLD",
      drawConfig: {
        statMin: 80,
        statMax: 90,
        team: "all",
        position: "all",
      },
    },
    {
      id: "silver",
      title: "실버 선수팩",
      price: 500,
      stars: 3,
      themeClass: "silver-pack",
      grade: "SILVER",
      drawConfig: {
        statMin: 80,
        statMax: 90,
        team: "all",
        position: "all",
      },
    },
    {
      id: "bronze",
      title: "브론즈 선수팩",
      price: 200,
      stars: 2,
      themeClass: "bronze-pack",
      grade: "BRONZE",
      drawConfig: {
        statMin: 80,
        statMax: 90,
        team: "all",
        position: "all",
      },
    },
    {
      id: "normal",
      title: "노말 선수팩",
      price: 100,
      stars: 1,
      themeClass: "normal-pack",
      grade: "NORMAL",
      drawConfig: {
        statMin: 80,
        statMax: 90,
        team: "all",
        position: "all",
      },
    },
  ];
  // ✅ SmallCheckModal (공용 확인 모달 상태)
  const isSmallCheckOpen = ref(false);
  const smallCheckTitle = ref("");
  const smallCheckMessage = ref("");
  const smallCheckConfirmText = ref("확인");
  const smallCheckCancelText = ref("취소");
  const smallCheckDanger = ref(false);

  // confirm/cancel 콜백을 동적으로 갈아끼우기
  let onSmallCheckConfirm = null;
  let onSmallCheckCancel = null;

  // gold 차감 (부족하면 committed=false)
  const spendGoldTx = async (uid, amount) => {
    const goldRef = dbRef(database, `users/${uid}/gold`);

    const result = await runTransaction(goldRef, (current) => {
      const cur = Number(current ?? 0);
      if (!Number.isFinite(cur)) return cur;
      if (cur < amount) return; // abort
      return cur - amount;
    });

    return result.committed;
  };

  // gold 환불
  const addGoldTx = async (uid, amount) => {
    const goldRef = dbRef(database, `users/${uid}/gold`);

    const result = await runTransaction(goldRef, (current) => {
      const cur = Number(current ?? 0);
      if (!Number.isFinite(cur)) return cur;
      return cur + amount;
    });

    return result.committed;
  };

  const openSmallCheck = ({
    title = "",
    message = "",
    confirmText = "확인",
    cancelText = "취소",
    danger = false,
    onConfirm = null,
    onCancel = null,
  } = {}) => {
    smallCheckTitle.value = title;
    smallCheckMessage.value = message;
    smallCheckConfirmText.value = confirmText;
    smallCheckCancelText.value = cancelText;
    smallCheckDanger.value = danger;

    onSmallCheckConfirm = onConfirm;
    onSmallCheckCancel = onCancel;

    isSmallCheckOpen.value = true;
  };

  const closeSmallCheck = () => {
    isSmallCheckOpen.value = false;
    onSmallCheckConfirm = null;
    onSmallCheckCancel = null;
  };

  const handleSmallCheckConfirm = async () => {
    const fn = onSmallCheckConfirm;
    closeSmallCheck();
    if (typeof fn === "function") await fn();
  };

  const handleSmallCheckCancel = async () => {
    const fn = onSmallCheckCancel;
    closeSmallCheck();
    if (typeof fn === "function") await fn();
  };
  const isPurchasing = ref(false);
  const cooldownUntil = ref(0);

  const isOnCooldown = computed(() => Date.now() < cooldownUntil.value);
  const canBuyNow = computed(() => !isPurchasing.value && !isOnCooldown.value);

  const buyPack = async (pack) => {
    if (!pack) return;
    if (!canBuyNow.value) return;
    cooldownUntil.value = Date.now() + 800; // 0.8초

    const user = auth.currentUser;
    if (!user) {
      openSmallCheck({
        title: "구매 불가",
        message: "로그인이 필요합니다.",
        confirmText: "확인",
        cancelText: "",
        danger: false,
        onConfirm: null,
        onCancel: null,
      });
      return;
    }

    if ((userGold.value ?? 0) < pack.price) {
      openSmallCheck({
        title: "구매 불가",
        message: "보유 골드가 부족합니다.",
        confirmText: "확인",
        cancelText: "",
        danger: true,
        onConfirm: null,
        onCancel: null,
      });
      return;
    }

    // ✅ 구매 가능 → 확인 모달
    openSmallCheck({
      title: "구매 확인",
      message: `${pack.title}을(를) 구매합니다.`,
      confirmText: "구매",
      cancelText: "취소",
      danger: false,
      onConfirm: async () => {
        await purchaseAndDrawOne(pack);
      },
    });
  };
  const normalizeFilter = (v) => {
    if (!v || v === "all") return null;
    return Array.isArray(v) ? v : [v];
  };

  const pickRandomPlayer = (allPlayers, config) => {
    const teamFilter = normalizeFilter(config?.team);
    const posFilter = normalizeFilter(config?.position);

    const statMin = config?.statMin ?? 0;
    const statMax = config?.statMax ?? 999;

    // ✅ 1. 실제 DB stat 기준으로 필터링
    let pool = allPlayers.filter((p) => {
      const baseStat = Number(p.stat); // playerDb.json에 있는 실제 스탯
      if (Number.isNaN(baseStat)) return false;

      if (baseStat < statMin || baseStat > statMax) return false;

      if (teamFilter && !teamFilter.includes(p.team || p.club)) return false;
      if (posFilter && !posFilter.includes(p.mainPosition || p.pos)) return false;

      return true;
    });

    // ✅ 2. 조건에 맞는 선수가 없으면 fallback
    if (!pool.length) {
      pool = allPlayers.filter((p) => {
        const baseStat = Number(p.stat);
        return !Number.isNaN(baseStat);
      });
    }

    // ✅ 3. 랜덤 1명 선택 (stat은 덮어쓰지 않음!)
    const picked = pool[Math.floor(Math.random() * pool.length)];

    return makePlayerEntity(picked);
  };

  // ✅ 중복이면 count 증가 (현재 인벤 구조 유지)
  const addToInventory = async (player) => {
    const user = auth.currentUser;
    if (!user || !player) return;

    const invRef = dbRef(database, `users/${user.uid}/inventory/${player.id}`);
    const snap = await get(invRef);

    if (!snap.exists()) {
      await set(invRef, {
        id: player.id,
        pos: player.mainPosition || player.pos,
        count: 1,
        updatedAt: Date.now(),
      });
    } else {
      const cur = snap.val();
      await update(invRef, {
        count: (cur.count ?? 1) + 1,
        updatedAt: Date.now(),
      });
    }
  };

  const purchaseAndDrawOne = async (pack) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await ensurePlayerDbLoaded();
      const allPlayers = getAllPlayersFlat();

      // ✅ 1. 골드 차감 (트랜잭션)
      const committed = await spendGoldTx(user.uid, pack.price);

      if (!committed) {
        openSmallCheck({
          title: "구매 실패",
          message: "보유 골드가 부족합니다.",
          confirmText: "확인",
          cancelText: "",
          danger: true,
        });
        return;
      }

      // ✅ 2. 선수 1장 생성
      const newPlayer = pickRandomPlayer(allPlayers, pack.drawConfig);

      try {
        // ✅ 3. 인벤토리 저장
        await addToInventory(newPlayer);
        await fetchUserInventory();

      } catch (invErr) {
        // ❗ 인벤 저장 실패 → 환불
        await addGoldTx(user.uid, pack.price);
        throw invErr;
      }

      // ✅ 4. 결과 표시
      selectedPlayerForView.value = newPlayer;
      openModal("detail");
      triggerToast(`${newPlayer.name} 영입!`);

    } catch (e) {
      console.error("구매/뽑기 실패:", e);
      triggerToast("구매 중 오류가 발생했습니다.");
    }
  };






  /** -----------------------------
   *  exports
   --------------------------------*/
  return {
    squad, cardPacks,
    // views
    VIEW_KEY,
    currentView, goToShop, goToField,
    isTopMenuOpen, topSelectAndClose,
    isMenuOpen, selectAndClose,

    // auth
    isLoggedIn, authMode,
    openLoginModal, openRegisterModal,
    handleRegister, handleLogin, handleLogout,
    displayName,

    // modal (unified)
    isModalOpen, modalType, openModal, closeModal,

    // gacha
    openGacha, selectPlayer, gachaOptions, currentPos,

    formation, formationPresets, formationRows, changeFormation, isReadyToShowField,

    // drag
    onDragStart, onDrop, onDragEnter, onDragLeave, draggedSlotKey, dragOverSlotKey,

    // stats
    averageOvr, teamColorInfo, isSaved,
    saveTeamUpdate,
    saveTeamInitial, handleSaveClick,
    sortType,
    searchQuery,

    // inventory
    playerInventory, fetchUserInventory,
    filteredInventory, groupedByPosition,
    POSITION_GROUP_MAP, groupedByLine,
    visibleCount, releaseSelectedPlayers, canReleasePlayer, isInSquad,

    selectedInventoryIds, toggleInventorySelect,

    // ui
    showToast, toastMessage, triggerToast,
    selectedPlayerForView, openPlayerDetail, openStorageModal,
    handleImageError,
    saveData,
    userGold,

    openReleaseModal, closeReleaseModal, confirmRelease,
    isReleaseModalOpen, selectedPlayers, togglePlayerSelect,
    clearInventorySelection,
    buyPack,

    isSmallCheckOpen,
    smallCheckTitle,
    smallCheckMessage,
    smallCheckConfirmText,
    smallCheckCancelText,
    smallCheckDanger,
    openSmallCheck,
    closeSmallCheck,
    handleSmallCheckConfirm,
    handleSmallCheckCancel,
    spendGoldTx, addGoldTx,
  };

}
