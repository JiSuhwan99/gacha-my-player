<script setup>
import PlayerCard from './components/PlayerCard.vue'
import SmallCheckModal from './components/SmallCheckModal.vue'
import { useGacha } from "./composables/gacha.js";

const {
  squad,cardPacks,
  VIEW_KEY,
  currentView,
  goToShop,
  goToField,
  isTopMenuOpen,
  topSelectAndClose,
  isMenuOpen,
  isReleaseModalOpen,
  selectAndClose,
  sortType,
  searchQuery,

  isLoggedIn,
  authMode,
  openLoginModal,
  openRegisterModal,
  openStorageModal,
  handleRegister,
  handleLogin,
  handleLogout,
  displayName,
  userGold,

  isModalOpen,
  modalType,
  openModal,
  closeModal,

  openGacha,
  selectPlayer,
  gachaOptions,
  currentPos,

  formation,
  formationPresets,
  formationRows,
  changeFormation,
  isReadyToShowField,

  onDragStart,
  onDrop,
  onDragEnter,
  onDragLeave,
  draggedSlotKey,
  dragOverSlotKey,

  averageOvr,
  teamColorInfo,
  isSaved,
  saveTeamUpdate,
  saveTeamInitial,
  handleSaveClick,
  
  POSITION_GROUP_MAP, groupedByLine,
  playerInventory,
  fetchUserInventory,
  filteredInventory,
  groupedByPosition,
  visibleCount,
  releaseSelectedPlayers, canReleasePlayer, isInSquad,
  selectedInventoryIds, toggleInventorySelect,

  showToast,
  toastMessage,
  triggerToast,

  selectedPlayerForView,
  openPlayerDetail,
  closeDetailModal,
  handleImageError,
  saveData,
  
  pendingReleaseIds,
  openReleaseModal, closeReleaseModal, confirmRelease,
  selectedPlayers, togglePlayerSelect, clearInventorySelection,
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
    isSquadManageMode,
    toggleMode,
} = useGacha();
</script>

<template>
    <div class="game-wrapper">
        <Transition name="slide-fade">
            <div v-if="showToast" class="toast-message flex-center">
                {{ toastMessage }}
            </div>
        </Transition>

        <header class="header">
            <div class="header-content flex-center">
                <div class="header-text">
                    <h1 class="header-title" @click="goToField">GACHA MY PLAYER</h1>
                    <p class="header-sub-title">나만의 베스트 11을 완성하세요</p>
                </div>

                <div class="auth-area">
                    <div class="auth-area-box">
                        <template v-if="!isLoggedIn">
                            <button class="btn-type-1" @click="openLoginModal">로그인</button>
                            
                        </template>
                        <div v-else class="user-logged-in">
                            <button class="btn-type-1" @click="handleLogout">로그아웃</button>
                        </div>
                        <button class="btn-type-1" @click="isTopMenuOpen = true">메뉴</button>
                        <div v-if="isLoggedIn" class="user-info">
                          {{ displayName }}님
                          <div class="user-points">
                            <span class="points">{{ userGold.toLocaleString() }}</span>
                            <span>G</span>
                          </div>
                        </div>
                    </div>
                </div>
            </div>

            <div :class="['top-menu', { 'is-open': isTopMenuOpen }]">
                <div class="top-menu-container flex-center">
                    <div v-if="isLoggedIn" class="top-menu-group">
                        <button class="top-menu-card storage" @click="topSelectAndClose('field')">
                            <span class="icon">📦</span>
                            <div class="info">
                                <span class="label">홈으로 이동</span>
                                <span class="desc">홈화면으로 이동하기</span>
                            </div>
                        </button>

                        <button class="top-menu-card shop" @click="topSelectAndClose('shop')">
                            <span class="icon">💎</span>
                            <div class="info">
                                <span class="label">스페셜 상점</span>
                                <span class="desc">새로운 팩 뽑기</span>
                            </div>
                        </button>

                        <button class="top-menu-card quest">
                            <span class="icon">📜</span>
                            <div class="info">
                                <span class="label">퀘스트</span>
                                <span class="desc">보상 수령하기</span>
                            </div>
                        </button>

                        <button class="top-menu-card quest">
                            <span class="icon">⚽</span>
                            <div class="info">
                                <span class="label">PvP 대결</span>
                            </div>
                        </button>

                        <button class="top-menu-card quest">
                            <span class="icon">⚽</span>
                            <div class="info">
                                <span class="label">AI 대결</span>
                            </div>
                        </button>
                    </div>

                    <div v-else class="top-menu-group">
                        <div class="impossibleMenu flex-center">로그인 후 이용이 가능합니다.</div>
                        <button class="top-menu-card storage">
                            <span class="icon">📦</span>
                            <div class="info">
                                <span class="label">홈으로 이동</span>
                                <span class="desc">홈화면으로 이동하기</span>
                            </div>
                        </button>

                        <button class="top-menu-card shop" @click="goToShop">
                            <span class="icon">💎</span>
                            <div class="info">
                                <span class="label">스페셜 상점</span>
                                <span class="desc">새로운 팩 뽑기</span>
                            </div>
                        </button>

                        <button class="top-menu-card quest">
                            <span class="icon">📜</span>
                            <div class="info">
                                <span class="label">퀘스트</span>
                                <span class="desc">보상 수령하기</span>
                            </div>
                        </button>

                        <button class="top-menu-card quest">
                            <span class="icon">⚽</span>
                            <div class="info">
                                <span class="label">PvP 대결</span>
                            </div>
                        </button>

                        <button class="top-menu-card quest">
                            <span class="icon">⚽</span>
                            <div class="info">
                                <span class="label">AI 대결</span>
                            </div>
                        </button>
                    </div>

                    <div class="top-menu-footer flex-center">
                        <button class="full-close-btn" @click="isTopMenuOpen = false">
                            닫기 <span class="arrow">▲</span>
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="isTopMenuOpen" class="top-menuoverlay" @click="isTopMenuOpen = false"></div>
        </header>

        <main class="main-display flex-center">
            <section v-if="currentView === 'field'" class="view-field">
                <div class="save-btn-wrapper" v-if="!isSaved">
                    <div class="tooltip-base">
                        팀을 저장해야 선수들이<br />사라지지 않아요!
                    </div>
                    <button
                        v-if="!isLoggedIn"
                        class="floating-save-btn"
                        @click="handleSaveClick"
                        >
                        <span class="icon">💾</span> 팀 저장하기
                    </button>
                </div>

                <div class="spacer"">
                </div>
                <section class="field-area flex-center">
                    <div v-if="isReadyToShowField" :class="['gacha-field flex-center', 'f-' + formation.name]">
                        <TransitionGroup name="field-transition">
                            <div v-for="(row, rowIndex) in formationRows" :key="'row-' + rowIndex" class="squad-row">
                                <div
                                    v-for="slot in row"
                                    :key="slot.slotKey"
                                    class="player-box"
                                    :class="[
                                        slot.pos.toLowerCase(),
                                        `${slot.pos.toLowerCase()}-${slot.index}`,
                                        { 'is-drag-over': dragOverSlotKey === slot.slotKey },
                                    ]"
                                    :draggable="!!squad[slot.slotKey]"
                                    @dragstart="onDragStart($event, slot.slotKey)"
                                    @dragover.prevent
                                    @dragenter="onDragEnter(slot.slotKey)"
                                    @dragleave="onDragLeave"
                                    @drop="onDrop(slot.slotKey)"
                                    @click="!squad[slot.slotKey] && openGacha(slot.pos, slot.index)"
                                    @contextmenu.prevent="squad[slot.slotKey] && openPlayerDetail($event, squad[slot.slotKey])"
                                >

                                    <PlayerCard
                                        v-if="squad[slot.slotKey]"
                                        :name="squad[slot.slotKey].name"
                                        :stat="squad[slot.slotKey].stat"
                                        :image="squad[slot.slotKey].image"
                                        :teamColor="squad[slot.slotKey].teamColor"
                                        size="sm"
                                        variant="field"
                                        :showStat="true"
                                        @imgError="handleImageError"
                                    />

                                    <span v-else class="pos-label">{{ slot.pos }}</span>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>

                    <div v-else :class="['empty-state', 'f-' + formation.name]">
                        <div class="gacha-field flex-center">
                            <div v-for="(row, rowIndex) in formationRows" :key="'row-' + rowIndex" class="squad-row">
                                <div v-for="slot in row" :key="slot.slotKey" class="player-slot fixed-mode" :class="[
                                    slot.pos.toLowerCase(), // 'st'
                                    `${slot.pos.toLowerCase()}-${slot.index}`, // 'st-0'
                                    ]" @click="openGacha(slot.pos, slot.index)"
                                    @contextmenu="openPlayerDetail($event, squad[slot.slotKey])">
                                    <PlayerCard
                                    v-if="squad[slot.slotKey]"
                                    :name="squad[slot.slotKey].name"
                                    :stat="squad[slot.slotKey].stat"
                                    :image="squad[slot.slotKey].image"
                                    :teamColor="squad[slot.slotKey].teamColor"
                                    size="sm"
                                    variant="field"
                                    :clickable="false"
                                    :contextable="true"
                                    @context="openPlayerDetail($event, squad[slot.slotKey])"
                                    @imgError="handleImageError"
                                    />

                                    <span v-else class="pos-label">{{ slot.pos }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <aside class="info-sidebar">
                    <div class="info-card-container">
                        <nav class="formation-selector">
                            <div class="tooltip-base">
                                팀을 저장하면 선수들이<br />사라지지 않아요!
                            </div>
                            <button class="ham-menu-group" @click="isMenuOpen = !isMenuOpen">
                                <span>{{ formation.name }}</span>
                                <i class="arrow-icon" :class="{ 'is-open': isMenuOpen }">▼</i>
                            </button>

                            <Transition name="slide-fade">
                                <div v-if="isMenuOpen" class="dropdown-menu">
                                    <button v-for="(slots, name) in formationPresets" :key="name"
                                        :class="{ active: formation.name === name }" @click="selectAndClose(name)">
                                        {{ name }}
                                    </button>
                                </div>
                            </Transition>
                        </nav>
                        <div class="info-card highlight">
                            <div class="card-label">평균 OVR</div>
                            <div class="card-value">{{ averageOvr }}</div>
                        </div>
                        <div class="info-card">
                            <div class="card-label">적용 팀컬러</div>
                            <ul class="card-value team-color">
                            <li class="">
                                {{ teamColorInfo.name }}
                                <span>{{ teamColorInfo.level }}단계</span>
                            </li>
                            <li class="ovr-buff">
                                해당 선수 OVR +{{ teamColorInfo.buff }}
                            </li>
                            </ul>
                        </div>

                        <button @click="isSquadManageMode = !isSquadManageMode" class="change-btn btn-type-2">토글</button>

                        <button v-if="isLoggedIn" class="change-btn btn-type-2" @click="openStorageModal">
                            <span>선수 보관함</span>
                        </button>

                        <button v-if="isLoggedIn" class="save-btn btn-type-2" :class="{ 'is-saved': isSaved }" @click="handleSaveClick">
                            <span>스쿼드 저장</span>
                        </button>
                    </div>
                </aside>
            </section>

            <section v-if="currentView === 'shop'" class="shop-field">
                <div class="shop-content">
                <div
                    v-for="pack in cardPacks"
                    :key="pack.id"
                    class="card-pack"
                    :class="pack.themeClass"
                    >
                    <div class="card-pack-inner">
                        <div class="pack-container">
                        <div class="pack-group">
                            <div class="pack-inner">
                            <div class="pack-header">PREMIUM</div>
                            <div class="pack-main-title">{{ pack.grade }}</div>
                            <div class="pack-sub-title">PLAYER PACK</div>
                            <div class="pack-deco">
                                {{ "★ ".repeat(pack.stars).trim() }}
                            </div>
                            </div>
                            <div class="pack-price">💰 {{ pack.price }} G</div>
                        </div>
                        </div>
                    </div>

                    <div class="card-pack-info">
                        <div class="card-info-box">
                        <p>{{ pack.title }}</p>
                        <p class="card-price">
                            <span>{{ pack.price }}</span> G
                        </p>
                        </div>

                        <button
                        class="btn-type-2 card-buy-button"
                        @click="buyPack(pack)"
                        >
                        구매
                        </button>
                    </div>
                </div>
                </div>
            </section>
        </main>

        <Transition name="fade">
            <div v-if="isModalOpen" class="modal-overlay" @click.self="modalType !== 'auth' && closeModal()">

                <!-- gacha -->
                <div v-if="modalType === 'gacha'" class="modal-content">
                    <h2 class="gacha-title">선수 카드를 1장 뽑아주세요.</h2>
                    <div class="card-container">
                        <PlayerCard
                            v-for="p in gachaOptions"
                            :key="p.id"
                            :name="p.name"
                            :image="p.image"
                            :teamColor="p.teamColor"
                            :stat="p.stat"
                            :badges="[currentPos]"
                            size="lg"
                            variant="gacha"
                            :clickable="true"
                            :showStat="true"
                            @click="selectPlayer(p)"
                            @imgError="handleImageError"
                        />
                    </div>
                </div>

                <!-- auth -->
                <div v-else-if="modalType === 'auth'" class="modal-content save-form-modal">
                    <h2 class="modal-title"><span>GACHA MY PLAYER</span></h2>
                    <div class="input-group">
                        <input v-if="authMode === 'register'" v-model="saveData.nickname" type="text" placeholder="닉네임 (10자 이내)" maxlength="10" />
                        <input v-model="saveData.id" type="text" placeholder="아이디 (영문+숫자 4자 이상)" />
                        <input v-model="saveData.pw" type="password" placeholder="비밀번호 (6자 이상)" />
                        <input v-if="authMode === 'register'" v-model="saveData.pwConfirm" type="password" placeholder="비밀번호 확인" />
                    </div>

                    <div class="modal-btns">
                        <button class="confirm-btn" @click="authMode === 'login' ? handleLogin() : handleRegister()">
                        {{ authMode === "login" ? "로그인" : "등록하기" }}
                        </button>
                        <button class="cancel-btn" @click="closeModal">닫기</button>
                    </div>
                </div>

                <!-- detail -->
                <div v-else-if="modalType === 'detail'" class="modal-content detail-mode">
                <div>
                    <PlayerCard
                    :name="selectedPlayerForView?.name"
                    :image="selectedPlayerForView?.image"
                    :teamColor="selectedPlayerForView?.teamColor"
                    :stat="selectedPlayerForView?.stat"
                    :badges="[selectedPlayerForView?.mainPosition, selectedPlayerForView?.subPosition1, selectedPlayerForView?.subPosition2].filter(Boolean)"
                    size="xl"
                    variant="detail"
                    :showStat="true"
                    @imgError="handleImageError"
                    />


                    <button class="cancel-btn" @click="closeModal">닫기</button>
                    </div>
                </div>

                <!-- storage -->
                

                <div v-else-if="modalType === 'storage'" class="modal-content storage-mode"
                :class="{ 'squad-manage-mode': isSquadManageMode }">
                    <div class="storage-content">

                        <div class="storage-toolbar">
                            <div class="toolbar-left">
                                <input
                                type="text"
                                class="storage-search"
                                placeholder="선수 검색"
                                v-model="searchQuery"
                                />

                                <select class="storage-sort" v-model="sortType">
                                    <option value="recent">최근획득</option>
                                    <option value="stat">능력치</option>
                                    <option value="name">이름</option>
                                    <option value="position">포지션</option>
                                </select>
                            </div>

                            <div class="toolbar-right">
                                <button class="tool-btn">잠금</button>
                                <button
                                class="tool-btn danger"
                                @click="releaseSelectedPlayers"
                                >
                                방출
                                </button>


                                <button
                                class="tool-btn primary"
                                @click="isSquadManageMode = true"
                                >
                                선수교체
                                </button>
                            </div>
                        </div>

                        

                        <aside v-if="isSquadManageMode" class="storage-info-sidebar">
                            <div class="info-card-container">
                                <div class="info-card highlight">
                                    <div class="card-label">평균 OVR</div>
                                    <div class="card-value">{{ averageOvr }}</div>
                                </div>
                                <div class="info-card">
                                    <div class="card-label">적용 팀컬러</div>
                                    <ul class="card-value team-color">
                                    <li class="">
                                        {{ teamColorInfo.name }}
                                        <span>{{ teamColorInfo.level }}단계</span>
                                    </li>
                                    <li class="ovr-buff">
                                        해당 선수 OVR +{{ teamColorInfo.buff }}
                                    </li>
                                    </ul>
                                </div>
                                <div class="storage-info-inner-box">
                                
                                <nav class="formation-selector">
                                    <div class="tooltip-base">
                                        팀을 저장하면 선수들이<br />사라지지 않아요!
                                    </div>
                                    <button class="ham-menu-group" @click="isMenuOpen = !isMenuOpen">
                                        <span>{{ formation.name }}</span>
                                        <i class="arrow-icon" :class="{ 'is-open': isMenuOpen }">▼</i>
                                    </button>

                                    <Transition name="slide-fade">
                                        <div v-if="isMenuOpen" class="dropdown-menu">
                                            <button v-for="(slots, name) in formationPresets" :key="name"
                                                :class="{ active: formation.name === name }" @click="selectAndClose(name)">
                                                {{ name }}
                                            </button>
                                        </div>
                                    </Transition>
                                </nav>
                                <button v-if="isLoggedIn" class="save-btn btn-type-2" :class="{ 'is-saved': isSaved }" @click="handleSaveClick">
                                    <span>스쿼드 저장</span>
                                </button>
                                </div>
                            </div>
                        </aside>

                        <aside class="storage-sidebar" >
                            <strong>총 {{ visibleCount }}장 보유</strong>
                        </aside>

                        

                        <div v-if="sortType !== 'position'" class="player-grid">
                            <div
                            v-for="player in filteredInventory"
                            :key="player.instanceId"
                            class="storage-player-box"
                            :class="{ 'is-squad': isInSquad(player.instanceId) }"
                            >

                                <label
                                :class="{ disabled: isInSquad(player.instanceId) }">
                                <input
                                type="checkbox"
                                :checked="selectedPlayers.includes(player.instanceId)"
                                @change="togglePlayerSelect(player.instanceId)"
                                :disabled="isInSquad(player.instanceId)"
                                />
                                <span></span>
                                </label>

                                <PlayerCard
                                :name="player.name"
                                :stat="player.stat"
                                :image="player.image"
                                :teamColor="player.teamColor"
                                size="sm"
                                variant="field"
                                :clickable="false"
                                :contextable="true"
                                @context="openPlayerDetail($event, player)"
                                @imgError="handleImageError"
                                />

                                <div v-if="isInSquad(player.instanceId)" class="squad-badge flex-center">
                                주전 선수
                                </div>
                            </div>
                        </div>

                        <!-- 포지션 정렬 -->
                        <div v-else>
                            <div
                            v-for="(players, line) in groupedByLine"
                            :key="line"
                            >
                            <div
                                v-if="players && players.length"
                                class="category-section"
                            >
                                <h2 class="category-title">
                                {{ line }}
                                <span class="count">{{ players.length }}</span>
                                </h2>

                                <div class="player-grid">
                                <div
                                v-for="player in players"
                                :key="player.instanceId"
                                class="storage-player-box"
                                :class="{ 'is-squad': isInSquad(player.instanceId) }"
                                >
                                    <label
                                    :class="{ disabled: isInSquad(player.instanceId) }">
                                    <input
                                    type="checkbox"
                                    :checked="selectedPlayers.includes(player.instanceId)"
                                    @change="togglePlayerSelect(player.instanceId)"
                                    :disabled="isInSquad(player.instanceId)"
                                    />
                                    <span></span>
                                    </label>

                                    <PlayerCard
                                    :name="player.name"
                                    :stat="player.stat"
                                    :image="player.image"
                                    :teamColor="player.teamColor"
                                    size="sm"
                                    variant="field"
                                    :clickable="false"
                                    :contextable="true"
                                    @context="openPlayerDetail($event, player)"
                                    @imgError="handleImageError"
                                    />

                                    <div
                                    v-if="isInSquad(player.instanceId)"
                                    class="squad-badge flex-center"
                                    >
                                    주전 선수
                                    </div>
                                </div>
                                </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    
                    <div v-if="isSquadManageMode" class="field-area flex-center">
                        <div v-if="isReadyToShowField" :class="['gacha-field flex-center', 'f-' + formation.name]">
                            <TransitionGroup name="field-transition">
                                <div v-for="(row, rowIndex) in formationRows" :key="'row-' + rowIndex" class="squad-row">
                                    <div
                                        v-for="slot in row"
                                        :key="slot.slotKey"
                                        class="player-box"
                                        :class="[
                                            slot.pos.toLowerCase(),
                                            `${slot.pos.toLowerCase()}-${slot.index}`,
                                            { 'is-drag-over': dragOverSlotKey === slot.slotKey },
                                        ]"
                                        :draggable="!!squad[slot.slotKey]"
                                        @dragstart="onDragStart($event, slot.slotKey)"
                                        @dragover.prevent
                                        @dragenter="onDragEnter(slot.slotKey)"
                                        @dragleave="onDragLeave"
                                        @drop="onDrop(slot.slotKey)"
                                        @click="!squad[slot.slotKey] && openGacha(slot.pos, slot.index)"
                                        @contextmenu.prevent="squad[slot.slotKey] && openPlayerDetail($event, squad[slot.slotKey])"
                                    >

                                        <PlayerCard
                                            v-if="squad[slot.slotKey]"
                                            :name="squad[slot.slotKey].name"
                                            :stat="squad[slot.slotKey].stat"
                                            :image="squad[slot.slotKey].image"
                                            :teamColor="squad[slot.slotKey].teamColor"
                                            size="sm"
                                            variant="field"
                                            :showStat="true"
                                            @imgError="handleImageError"
                                        />

                                        <span v-else class="pos-label">{{ slot.pos }}</span>
                                    </div>
                                </div>
                            </TransitionGroup>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
        
        <Transition name="fade">
            <SmallCheckModal
            v-if="isReleaseModalOpen"
            @confirm="confirmRelease"
            @cancel="closeReleaseModal"
            >
            선택한 선수를 방출하시겠습니까?
            <span>방출된 선수는 복구할 수 없습니다.</span>
            </SmallCheckModal>
        </Transition>

        <Transition name="fade">
        <SmallCheckModal
            v-if="isSmallCheckOpen"
            :title="smallCheckTitle"
            :confirm-text="smallCheckConfirmText"
            :cancel-text="smallCheckCancelText"
            :danger="smallCheckDanger"
            @confirm="handleSmallCheckConfirm"
            @cancel="handleSmallCheckCancel"
        >
            {{ smallCheckMessage }}
        </SmallCheckModal>
        </Transition>


    </div>
</template>
