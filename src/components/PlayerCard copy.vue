<template>
  <div
    class="player-card"
    :class="[
      variant && `player-card-${variant}`,
      size && `player-card-${size}`,
      { 'is-clickable': clickable }
    ]"
    @click="clickable && $emit('click')"
    @contextmenu.prevent="contextable && $emit('context')"
  >
    <div class="player-card-inner">
        <div class="player-card-team-dot" :class="teamColor"></div>

        <div class="player-card-img-box">
            <img class="player-card-img" :src="image" @error="$emit('imgError', $event)" draggable="false" />
        </div>

        <div class="player-card-info">
        <span class="player-card-name">{{ name }}</span>
        <span class="player-card-stat">{{ stat }}</span>

        <div v-if="badges?.length" class="player-card-badges">
            <span v-for="(b, i) in badges" :key="i" class="player-card-badge">{{ b }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
    defineProps({
    name: String,
    image: String,
    teamColor: String,
    stat: [String, Number],
    badges: Array,
    variant: String, // 'field' | 'storage' | 'gacha' | 'detail'
    size: String,    // 'sm' | 'md' | 'lg' | 'xl'
    clickable: Boolean,
    contextable: Boolean,
    });
    defineEmits(["click", "context", "imgError"]);
</script>

<style>
/* Base */
.player-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--r-8);
  overflow: hidden;
  background: linear-gradient(145deg, var(--mint) 0%, var(--mint-2) 50%, var(--mint-3) 100%);
  border: 3px solid #329590;
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.1),
    inset 0 0 15px rgba(255, 255, 255, 0.5);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.player-card-inner {
  display: flex;
  flex-flow: column;
  justify-content: flex-end;
  height: 100%;
  width: 100%;
}

.player-card-team-dot {
  position: absolute;
  top: 5%;
  right: 5%;
  width: 20%;
  height: auto;
  aspect-ratio: 1/1;
  border-radius: 50%;
}
.player-card-team-dot.team-tiger {
  background: #ff9f1a;
  box-shadow: 0 0 10px rgba(255,159,26,.8);
}

.player-card-team-dot.blue-dragon {
  background: #1e90ff;
  box-shadow: 0 0 10px rgba(30,144,255,.8);
}

.player-card-team-dot.red-phoenix {
  background: #ff3b3b;
  box-shadow: 0 0 10px rgba(255,59,59,.8);
}

.player-card-team-dot.silver-wolf {
  background: #cfd8dc;
  box-shadow: 0 0 10px rgba(207,216,220,.7);
}

.player-card-team-dot.golden-eagles {
  background: #ffd700;
  box-shadow: 0 0 12px rgba(255,215,0,.9);
}

/* 선수 이미지 */
.player-card-img-box {
    height: 65%;
    width: 100%;
}
.player-card-img {
  width: 100%;
  height: auto;
  z-index: 1;
  opacity: 0.9;
  mask-image: linear-gradient(to bottom, black 65%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 65%, transparent 100%);
}

/* 하단 정보 */
.player-card-info {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  width: 100%;
  height: 35%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  padding: 5px;
}

.player-card-name {
  font-size: 0.7rem;
  font-weight: var(--font-bold);
  color: var(--light-gray);
  line-height: 1.2;
  text-shadow: 1px 1px 9px rgba(0, 0, 0, 0.5);
  z-index: 3;
  white-space:nowrap; 
}

.player-card-stat {
  font-size: 1rem;
  font-weight: var(--font-bold);
  color: var(--light-gray);
  text-shadow: 1px 1px 9px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.5px;
  z-index: 3;
}

/* 카드 광택 */
.player-card::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg,
      transparent 45%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 55%);
  transform: rotate(30deg);
  pointer-events: none;
  z-index: 4;
}
.player-card-badges {
    display: flex;
    gap: 10px;
}
.player-card-badge {
  font-size: 1rem;
  background: var(--badge-green);
  color: var(--white);
  padding: 2px 10px;
  border-radius: var(--r-8);
  margin-top: 2px;
}
.player-card-badge:first-child {

}

.player-card.is-clickable { cursor: pointer; }
.player-card.is-clickable:hover { transform: translateY(-6px) scale(1.03); }

.player-card-sm { width: 100px; height: 140px; }
.player-card-md { width: 140px; height: 200px; border-radius: var(--r-12); }
.player-card-lg { width: 200px; height: 280px; border-radius: var(--r-12); }
.player-card-xl { width: 400px; height: 560px; border-radius: var(--r-20); }

.player-card-gacha .player-card-stat { font-size: 2rem; }
.player-card-detail .player-card-name { font-size: 2rem; }
.player-card-detail .player-card-stat { font-size: 3rem; }
.player-card-detail { pointer-events: none; } /* 필요하면 */
</style>