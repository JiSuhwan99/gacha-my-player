<script setup>
import { useGacha } from "./composables/gacha.js";

const {
  dragOverSlotKey,
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
  formationRows,
  formation,
  formationPresets,
  changeFormation,
  getCategory,
  onDragStart,
  onDrop,
  onDragEnter,
  onDragLeave,
  selectedPlayerForView,
  showDetailModal,
  openPlayerDetail,
  closeDetailModal,
  isReadyToShowField,
  isMenuOpen,
  selectAndClose,
  isTopMenuOpen,
  topSelectAndClose,
  playerInventory,
  currentView,
  goToStorage,
  goToField,

  etchUserInventory,
  child,
} = useGacha();
</script>

<template>
  <div class="game-wrapper">
    <Transition name="slide-fade">
      <div v-if="showToast" class="toast-message">
        <span class="toast-icon">⚠️</span>
        {{ toastMessage }}
      </div>
    </Transition>

    <header class="header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="title">GACHA MY PLAYER</h1>
          <p class="subtitle">나만의 베스트 11을 완성하세요</p>
        </div>

        <div class="auth-area">
          <div class="auth-area-box">
            <template v-if="!isLoggedIn">
              <button class="login-btn" @click="openLoginModal">Login</button>
              <button class="signup-btn" @click="openSignUpModal">
                Sign Up
              </button>
            </template>
            <div v-else class="user-logged-in">
              <button class="logout-btn" @click="handleLogout">Logout</button>
            </div>
            <button class="menu-btn" @click="isTopMenuOpen = true">Menu</button>
            <span class="user-info">
              나의 닉네임 : {{ auth.currentUser?.displayName || "감독" }}
            </span>
          </div>
        </div>
      </div>

      <div :class="['top-menu', { 'is-open': isTopMenuOpen }]">
        <div class="menu-container">
          <div class="menu-grid">
            <button class="menu-card storage" @click="goToField">
              <span class="icon">📦</span>
              <div class="info">
                <span class="label">홈으로 이동</span>
                <span class="desc">홈화면으로 이동하기</span>
              </div>
            </button>
            <button class="menu-card storage" @click="goToStorage">
              <span class="icon">📦</span>
              <div class="info">
                <span class="label">선수 보관함</span>
                <span class="desc">획득한 선수 확인</span>
              </div>
            </button>

            <button class="menu-card shop" @click="goToShop">
              <span class="icon">💎</span>
              <div class="info">
                <span class="label">스페셜 상점</span>
                <span class="desc">새로운 팩 뽑기</span>
              </div>
            </button>

            <button class="menu-card quest">
              <span class="icon">📜</span>
              <div class="info">
                <span class="label">퀘스트</span>
                <span class="desc">보상 수령하기</span>
              </div>
            </button>

            <button class="menu-card quest">
              <span class="icon">⚽</span>
              <div class="info">
                <span class="label">PvP 대결</span>
              </div>
            </button>

            <button class="menu-card quest">
              <span class="icon">⚽</span>
              <div class="info">
                <span class="label">AI 대결</span>
              </div>
            </button>
          </div>

          <div class="menu-footer">
            <button class="full-close-btn" @click="isTopMenuOpen = false">
              닫기 <span class="arrow">▲</span>
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="isTopMenuOpen"
        class="menu-overlay"
        @click="isTopMenuOpen = false"
      ></div>
    </header>

    <main class="main-display">
      <section v-if="currentView === 'field'" class="view-field">
        <div class="spacer"></div>
        <section class="field-area">
          <div
            v-if="isReadyToShowField"
            :class="['field', 'f-' + formation.name]"
          >
            <TransitionGroup name="field-transition">
              <div
                v-for="(row, rowIndex) in formationRows"
                :key="'row-' + rowIndex"
                class="squad-row"
              >
                <div
                  v-for="slot in row"
                  :key="slot.slotKey"
                  class="player-box"
                  :class="[
                    slot.pos.toLowerCase(), // 'st'
                    `${slot.pos.toLowerCase()}-${slot.index}`, // 'st-0'
                    { 'is-drag-over': dragOverSlotKey === slot.slotKey }, // 드래그 조건부 클래스
                  ]"
                  :draggable="!!squad[slot.slotKey]"
                  @dragstart="onDragStart($event, slot.slotKey)"
                  @dragover.prevent
                  @dragenter="onDragEnter(slot.slotKey)"
                  @dragleave="onDragLeave"
                  @drop="onDrop(slot.slotKey)"
                  @click="openGacha(slot.pos, slot.index)"
                  @contextmenu="openPlayerDetail($event, squad[slot.slotKey])"
                >
                  <div v-if="squad[slot.slotKey]" class="player-card">
                    <div
                      class="team-dot"
                      :style="{
                        backgroundColor: squad[slot.slotKey].teamColor,
                      }"
                    ></div>
                    <img
                      :src="squad[slot.slotKey].image"
                      class="p-img"
                      @error="handleImageError"
                      @dragstart.prevent
                    />
                    <div class="p-info">
                      <span class="p-name">{{ squad[slot.slotKey].name }}</span>
                    </div>
                  </div>
                  <span v-else class="pos-label">{{ slot.pos }}</span>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <div v-else :class="['empty-state', 'f-' + formation.name]">
            <TransitionGroup name="field-transition">
              <div class="field">
                <div
                  v-for="(row, rowIndex) in formationRows"
                  :key="'row-' + rowIndex"
                  class="squad-row"
                >
                  <div
                    v-for="slot in row"
                    :key="slot.slotKey"
                    class="player-slot fixed-mode"
                    :class="[
                      slot.pos.toLowerCase(), // 'st'
                      `${slot.pos.toLowerCase()}-${slot.index}`, // 'st-0'
                    ]"
                    @click="openGacha(slot.pos, slot.index)"
                    @contextmenu="openPlayerDetail($event, squad[slot.slotKey])"
                  >
                    <div v-if="squad[slot.slotKey]" class="player-card">
                      <div
                        class="team-dot"
                        :style="{
                          backgroundColor: squad[slot.slotKey].teamColor,
                        }"
                      ></div>
                      <img
                        :src="squad[slot.slotKey].image"
                        class="p-img"
                        @error="handleImageError"
                      />
                      <div class="p-info">
                        <span class="p-name">{{
                          squad[slot.slotKey].name
                        }}</span>
                      </div>
                    </div>

                    <span v-else class="pos-label">{{ slot.pos }}</span>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </section>

        <aside class="info-sidebar">
          <div class="info-card-container">
            <nav class="formation-selector">
              <button class="menu-trigger" @click="isMenuOpen = !isMenuOpen">
                <span>{{ formation.name }}</span>
                <i class="arrow-icon" :class="{ 'is-open': isMenuOpen }">▼</i>
              </button>

              <Transition name="slide-fade">
                <div v-if="isMenuOpen" class="dropdown-menu">
                  <button
                    v-for="(slots, name) in formationPresets"
                    :key="name"
                    :class="{ active: formation.name === name }"
                    @click="selectAndClose(name)"
                  >
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
              <div class="card-value team-color">
                {{ teamColorInfo.name }}
                <span>{{ teamColorInfo.level }}단계</span>
              </div>
              <div class="card-value team-color">
                해당 선수 OVR +{{ teamColorInfo.buff }}
              </div>
            </div>

            <button
              class="save-btn"
              :class="{ 'is-saved': isSaved }"
              @click="submitSave"
            >
              <span>현재 스쿼드 저장</span>
            </button>
          </div>
        </aside>

        <div class="save-btn-wrapper" v-if="!isSaved">
          <div class="tooltip-base">
            팀을 저장해야 선수들이<br />사라지지 않아요!
          </div>
          <button
            v-if="!isLoggedIn"
            class="floating-save-btn"
            @click="submitSave"
          >
            <span class="icon">💾</span> 팀 저장하기
          </button>
        </div>
      </section>

      <section v-if="currentView === 'storage'" class="storage-field">
        <div class="storage-header">
          <button class="back-btn" @click="goToField">← BACK TO FIELD</button>
          <h2>MY PLAYER STORAGE</h2>
          <div class="storage-stats">
            Total: {{ playerInventory?.length || 0 }}
          </div>
        </div>

        <div class="storage-scroll-area">
          <div v-for="pos in positionOrder" :key="pos" class="position-group">
            <h3 class="pos-title">{{ pos }}</h3>

            <div class="player-grid">
              <div
                v-for="player in groupedPlayers[pos]"
                :key="player.id"
                class="storage-card"
              >
                <div
                  class="card-dot"
                  :style="{ backgroundColor: getPosColor(player.pos) }"
                ></div>

                <div class="card-info">
                  <div class="card-name">{{ player.name }}</div>
                  <div class="card-pos-text">({{ player.pos }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Transition name="fade">
      <div
        v-if="isModalOpen"
        class="modal-overlay"
        @click.self="isModalOpen = false"
      >
        <div class="modal-content">
          <h2 class="gacha-title">선수 카드를 1장 뽑아주세요.</h2>
          <div class="card-container">
            <div
              v-for="player in gachaOptions"
              :key="player.id"
              class="player-card gacha-card"
              @click="selectPlayer(player)"
            >
              <div
                class="team-dot"
                :style="{ backgroundColor: player?.teamColor || '#ffffff' }"
              ></div>
              <img
                :src="player?.image"
                class="p-img"
                @error="handleImageError"
                @dragstart.prevent
              />
              <div class="p-info">
                <span class="p-stat">{{ player?.stat }}</span>
                <span class="p-name">{{ player?.name }}</span>
                <span class="p-badge">{{ currentPos }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="isSaveModalOpen" class="modal-overlay">
        <div class="modal-content save-form-modal">
          <h2 class="modal-title"><span>GACHA MY PLAYER</span></h2>
          <div class="input-group">
            <input
              v-if="authMode === 'register'"
              v-model="saveData.nickname"
              type="text"
              placeholder="닉네임 (10자 이내)"
              maxlength="10"
            />
            <input
              v-model="saveData.id"
              type="text"
              placeholder="아이디 (영문+숫자 4자 이상)"
            />
            <input
              v-model="saveData.pw"
              type="password"
              placeholder="비밀번호 (6자 이상)"
            />
            <input
              v-if="authMode === 'register'"
              v-model="saveData.pwConfirm"
              type="password"
              placeholder="비밀번호 확인"
            />
          </div>
          <div class="modal-btns">
            <button
              class="confirm-btn"
              @click="
                authMode === 'login'
                  ? handleLogin()
                  : authMode === 'register'
                    ? handleRegister()
                    : submitSave()
              "
            >
              {{
                authMode === "login"
                  ? "로그인"
                  : authMode === "register"
                    ? "등록하기"
                    : "저장하기"
              }}
            </button>
            <button class="cancel-btn" @click="isSaveModalOpen = false">
              닫기
            </button>
          </div>
          <div class="auth-switch">
            <p v-if="authMode === 'login'">
              계정이 없으신가요?
              <span @click="authMode = 'register'">회원등록</span>
            </p>
            <p v-else-if="authMode === 'register'">
              이미 계정이 있나요?
              <span @click="authMode = 'login'">로그인</span>
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showDetailModal"
        class="modal-overlay detail-mode"
        @click.self="closeDetailModal"
      >
        <div class="player-card gacha-card">
          <div
            class="team-dot"
            :style="{
              backgroundColor: selectedPlayerForView?.teamColor || '#ffffff',
            }"
          ></div>
          <img
            :src="selectedPlayerForView?.image"
            class="p-img"
            @error="handleImageError"
          />
          <div class="p-info">
            <span class="p-stat">{{ selectedPlayerForView?.stat }}</span>
            <span class="p-name">{{ selectedPlayerForView?.name }}</span>
            <div class="player-position-box">
              <span class="p-badge p-main-position">{{
                selectedPlayerForView?.mainPosition
              }}</span>
              <span
                v-if="selectedPlayerForView?.subPosition1"
                class="p-badge p-sub-position"
              >
                {{ selectedPlayerForView.subPosition1 }}
              </span>
              <span
                v-if="selectedPlayerForView?.subPosition2"
                class="p-badge p-sub-position"
              >
                {{ selectedPlayerForView.subPosition2 }}
              </span>
            </div>
          </div>

          <button class="close-btn" @click="closeDetailModal">닫기</button>
        </div>
      </div>
    </Transition>
  </div>
</template>
