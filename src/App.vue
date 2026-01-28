<script setup>
import { useGacha } from "./composables/gacha.js";

const {
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
          <button v-if="!isLoggedIn" class="login-btn" @click="openLoginModal">
            Login
          </button>

          <div v-else class="user-logged-in">
            <span class="user-info">
              나의 닉네임 : {{ auth.currentUser?.displayName || "감독" }}
            </span>
            <button class="logout-btn" @click="handleLogout">Logout</button>
          </div>
        </div>
      </div>
    </header>

    <main class="main-display">
      <div class="spacer"></div>
      <section class="field-area">
        <div class="field">
          <div class="row forwards">
            <div
              v-for="n in 3"
              :key="'FW' + n"
              class="player-slot"
              @click="openGacha('FW', n)"
            >
              <div v-if="squad['FW' + n]" class="player-card">
                <div
                  class="team-dot"
                  :style="{ backgroundColor: player.teamColor }"
                ></div>
                <img
                  :src="
                    squad['FW' + n].image || '/assets/images/unknown_player.png'
                  "
                  alt="player"
                  class="p-img"
                  @error="handleImageError"
                />
                <div class="p-info">
                  <span class="p-name">{{ squad["FW" + n].name }}</span>
                  <span class="p-stat">{{ squad["FW" + n].stat }}</span>
                </div>
              </div>
              <span v-else class="pos-label">FW</span>
            </div>
          </div>

          <div class="row midfielders">
            <div
              v-for="n in 3"
              :key="'MF' + n"
              class="player-slot"
              @click="openGacha('MF', n)"
            >
              <div v-if="squad['MF' + n]" class="player-card">
                <div
                  class="team-dot"
                  :style="{ backgroundColor: player.teamColor }"
                ></div>
                <div></div>
                <img
                  :src="
                    squad['MF' + n].image || '/assets/images/unknown_player.png'
                  "
                  alt="player"
                  class="p-img"
                  @error="handleImageError"
                />
                <div class="p-info">
                  <span class="p-name">{{ squad["MF" + n].name }}</span>
                  <span class="p-stat">{{ squad["MF" + n].stat }}</span>
                </div>
              </div>
              <span v-else class="pos-label">MF</span>
            </div>
          </div>

          <div class="row defenders">
            <div
              v-for="n in 4"
              :key="'DF' + n"
              class="player-slot"
              @click="openGacha('DF', n)"
            >
              <div v-if="squad['DF' + n]" class="player-card">
                <div
                  class="team-dot"
                  :style="{ backgroundColor: player.teamColor }"
                ></div>
                <img
                  :src="
                    squad['DF' + n].image || '/assets/images/unknown_player.png'
                  "
                  alt="player"
                  class="p-img"
                  @error="handleImageError"
                />
                <div class="p-info">
                  <span class="p-name">{{ squad["DF" + n].name }}</span>
                  <span class="p-stat">{{ squad["DF" + n].stat }}</span>
                </div>
              </div>
              <span v-else class="pos-label">DF</span>
            </div>
          </div>

          <div class="row goalkeeper">
            <div class="player-slot" @click="openGacha('GK', 1)">
              <div v-if="squad['GK1']" class="player-card">
                <div
                  class="team-dot"
                  :style="{ backgroundColor: player.teamColor }"
                ></div>
                <img
                  :src="
                    squad['GK1'].image || '/assets/images/unknown_player.png'
                  "
                  alt="player"
                  class="p-img"
                  @error="handleImageError"
                />
                <div class="p-info">
                  <span class="p-name">{{ squad["GK1"].name }}</span>
                  <span class="p-stat">{{ squad["GK1"].stat }}</span>
                </div>
              </div>
              <span v-else class="pos-label">GK</span>
            </div>
          </div>
        </div>
      </section>

      <aside class="info-sidebar">
        <div class="info-card-container">
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
        </div>
      </aside>

      <div class="save-btn-wrapper" v-if="!isSaved">
        <div class="tooltip-base">
          팀을 저장해야 선수들이<br />
          사라지지 않아요!
        </div>
        <button class="floating-save-btn" @click="submitSave">
          <span class="icon">💾</span> 팀 저장하기
        </button>
      </div>
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
                :style="{ backgroundColor: player.teamColor }"
              ></div>
              <img
                :src="player.image || './assets/unknown_player.png'"
                class="p-img"
                @error="handleImageError"
              />

              <div class="p-info">
                <span class="p-stat">{{ player.stat }}</span>
                <span class="p-name">{{ player.name }}</span>
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
          <h2 class="modal-title">
            <span>GACHA MY PLAYER</span>
          </h2>

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
  </div>
</template>
