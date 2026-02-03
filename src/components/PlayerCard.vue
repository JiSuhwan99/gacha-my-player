<template>
  <div
    ref="cardRef"
    :style="tiltStyle"
    @mousemove="handleMouseMove"
    @mouseleave="resetTilt"
      v-if="resolved"<div
      class="player-card"
      :class="[
        variant && `player-card-${variant}`,
        size && `player-card-${size}`,
        { 
          'is-clickable': clickable,
          'ace-card': player?.grade?.toLowerCase() === 'ace'
        }
      ]"
      @click.left="clickable && $emit('click')"
  >
    <div class="stat-box" :style="statStyle">
    <div class="p-stat">{{ resolved.stat }}</div>
    </div>
    <div class="shield-frame">
      <div class="content-wrapper">
        <!-- 상단 팀 -->
        <div class="tier-tag">
          <span class="tier-text" :style="teamColorStyle">{{ resolved.team }}</span>
        </div>

        <!-- 선수 이미지 -->
        <div class="player-visual">
          <img
            class="p-img"
            :src="resolved.image"
            draggable="false"
          />
        </div>

        <!-- 정보 -->
        <div class="info-plate">
          <div class="name-row">
            <h1 class="p-name">{{ resolved.name }}</h1>
            <!-- 🔥 mainPosition 기준 FW / MF / DF / GK -->
            <span class="p-pos" :style="lineColorVars">{{ resolved.line }}</span>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <label>BIRTH</label>
              <div class="val val-nation">{{ resolved.nation }}</div>
            </div>
            
            <div class="stat-item">
              <label>BIRTH</label>
              <div class="val">{{ resolved.birth }}</div>
            </div>
            <div class="stat-item">
              <label>POSITION</label>
              <div class="val val-pos">{{ resolved.position }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="shield-frame2"></div>
    <div class="shield-frame3"></div>
    <div class="shield-frame4"></div>
  </div>
</template>

<script setup>
  import { onMounted, ref, computed, nextTick } from 'vue'
  import gsap from 'gsap'

  const haloRef = ref(null);
  const cardRef = ref(null)
  const tiltStyle = ref('')
  const gachaCardContainer = ref(null);

  /* mainPosition → FW / MF / DF / GK */
  const MAIN_POSITION_TO_LINE = {
    ST: 'FW',
    CF: 'FW',
    WF: 'FW',

    AM: 'MF',
    CM: 'MF',
    DM: 'MF',
    WM: 'MF',

    CB: 'DF',
    LB: 'DF',
    RB: 'DF',
    LWB: 'DF',
    RWB: 'DF',

    GK: 'GK',
  }

  const LINE_COLOR_CLASS = {
    FW: '#9b1414',
    MF: '#0d5bb4',
    DF: '#18901e',
    GK: '#b06816',
  }
  const lineColorVars = computed(() => {
    if (!resolved.value) return {}

    return {
      '--line-color': LINE_COLOR_CLASS[resolved.value.line] || '#aaa',
    }
  })
  const TEAM_COLOR_MAP = {
    '울산 HD FC': { main: '#013f88', sub: '#ffcc00', type: 1 },
    '전북 현대 모터스': { main: '#056545', sub: '#044e35', type: 1 },
    '포항 스틸러스': { main: '#000000', sub: '#f83531', type: 3 },
    'FC 서울': { main: '#ba151c', sub: '#000000', type: 2 },
    '인천 유나이티드': { main: '#025196', sub: '#23181c', type: 2 },
    '제주 SK FC': { main: '#ef7700', sub: '#d96d00', type: 1 },
    '김천 상무 FC': { main: '#00172f', sub: '#ba1e29', type: 1 },
    '강원 FC': { main: '#d9550b', sub: '#00615a', type: 1 },
    '광주 FC': { main: '#fed83b', sub: '#c70026', type: 1 },
    'FC 안양': { main: '#552784', sub: '#4c2276', type: 1 },
    '대전 하나 시티즌': { main: '#a02e48', sub: '#097868', type: 1 },
    '부천 FC 1995': { main: '#a52826', sub: '#000000', type: 1 },
    '수원 삼성 블루윙즈': { main: '#0058a7', sub: '#0d518d', type: 1 },
    '수원 FC': { main: '#013b6b', sub: '#d10a29', type: 2 },
    '대구 FC': { main: '#9dd6f4', sub: '#74c7f3', type: 1 },
  }

  const getTeamColor = (teamName) => {
    return TEAM_COLOR_MAP[teamName] || {
      main: '#444',
      sub: '#222',
      type: 0,
    }
  }

  const statStyle = computed(() => {
    if (!resolved.value) return {}

    const { main, sub, type } = getTeamColor(resolved.value.team)

    // type별 스타일 분기
    switch (type) {
      case 1: // 기본 그라데이션
        return {
          background: `linear-gradient(
          to right,
          ${main} 0%,
          ${main} 50%,
          ${sub} 50%,
          ${sub} 100%
        )`,
          //background: `linear-gradient(to right, ${main} 30%, ${sub} 100%)`,
        }

      case 2: // 다크 + 포인트
        return {
          background: `repeating-linear-gradient(
            to right,
            ${main} 0%,
            ${main} 20%,
            ${sub} 20%,
            ${sub} 40%,
            ${main} 40%,
            ${main} 60%,
            ${sub} 60%,
            ${sub} 80%,
            ${main} 80%,
            ${main} 100%
          )`,
        }

      case 3: // 강한 대비 (포항 같은 팀)
        return {
          background: `repeating-linear-gradient(
            to bottom,
            ${main} 0%,
            ${main} 20%,
            ${sub} 20%,
            ${sub} 40%,
            ${main} 40%,
            ${main} 60%,
            ${sub} 60%,
            ${sub} 80%,
            ${main} 80%,
            ${main} 100%
          )`,
        }
      default:
        return {
          background: '#222',
          color: '#fff',
        }
    }
  })

  const TEAM_COLOR_OVERRIDE = {
    '광주 FC': 'sub',
    '제주 SK FC': 'sub',
    '대구 FC': '#37a3c6', // 완전 다른 색 (직접 지정)
  }

  const teamColorStyle = computed(() => {
    if (!resolved.value) return {}
    const { main, sub } = getTeamColor(resolved.value.team)
    const override = TEAM_COLOR_OVERRIDE[resolved.value.team]

    return {
      color:
        override === 'sub'
          ? sub
          : override
          ? override
          : main,
    }
  })

  const lineClass = computed(() => {
    return LINE_COLOR_CLASS[resolved.value?.line]
  })

  const props = defineProps({
    player: {
      type: Object,
      required: true,
    },
    variant: String,
    size: String,
    clickable: Boolean,
    contextable: Boolean,
    appearDelay: {
      type: Number,
      default: 0,
    },
  })


  defineEmits(['click', 'context', 'imgError'])

  const resolved = computed(() => {
    const p = props.player
    if (!p) return null

    const positions = [
      p.mainPosition,
      p.subPosition1,
      p.subPosition2,
    ].filter(Boolean)

    return {
      name: p.name ?? '-',
      stat: p.stat ?? '-',
      team: p.team ?? '',
      nation: p.nation ?? '',
      birth: p.birth ?? '',
      position: positions.join(', ') || '-',
      line: MAIN_POSITION_TO_LINE[p.mainPosition] || 'ETC',
      image: `/public/images/unknown_player.png`,
    }
  })

  onMounted(() => {
    if (props.variant !== 'gacha') return
    if (!cardRef.value) return

    gsap.fromTo(
    cardRef.value,
    {
      opacity: 0,
      y: -100,
      rotateY: 40,
    },
    {
      opacity: 1,
      y: 0,
      rotateY: 0,
      duration: 1,
      ease: 'back.out(1.6)', // ⭐ 핵심
      delay: props.appearDelay,
    }
  )
  })

  const isTiltEnabled = computed(() =>
    props.size === 'lg' || props.size === 'xl'
  );

  const handleMouseMove = (e) => {
    if (!isTiltEnabled.value) return;
    if (!cardRef.value) return;
    const card = cardRef.value
    const { left, top, width, height } = card.getBoundingClientRect()
    
    // 카드 중심 기준 마우스 좌표 (-1 ~ 1)
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    
    // 기울기 강도 (숫자를 키울수록 많이 기울어짐)
    const rotateX = (y * -20).toFixed(2)
    const rotateY = (x * 20).toFixed(2)
    
    tiltStyle.value = `transform: perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
  }

  const resetTilt = () => {
    if (!isTiltEnabled.value) return;
    if (!cardRef.value) return;
    tiltStyle.value = 'transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }
</script>



<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap');

/* ===============================
   카드 컨테이너 (반응형 베이스)
================================ */
.player-card {
  --card-width: 150px;
  --img-scale: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: min(var(--card-width), 90vw);
}

.player-card-xl,
.player-card-lg {
  perspective: 1000px;
}
    

/* ===============================
   SHIELD FRAME (3중 레이어)
================================ */
.shield-frame {
  width: 90%;
  aspect-ratio: 1 / 1.5;
  position: relative;
  background: linear-gradient(45deg,
    #999 5%,
    #fff 10%,
    #ccc 30%,
    #ddd 50%,
    #ccc 70%,
    #fff 80%,
    #999 95%);
  clip-path: polygon(
    50% 0%,
    100% 12%,
    100% 82%,
    50% 100%,
    0% 82%,
    0% 12%
  );
  z-index: 50;

}

@keyframes rotate-border {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.player-card-lg:hover .shield-frame3::after,
.player-card-xl:hover .shield-frame3::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    #0062ff5f, 
    #00f2ff6b,
    #0062ff5f,
    #00f2ff6b,
    #0062ff5f 50%
  );
  animation: rotate-border 6s linear infinite;
}
.shield-frame2 {
  width: 95%;
  aspect-ratio: 1 / 1.5;
  background: #ffffff;
  clip-path: polygon(
    50% 0%,
    100% 12%,
    100% 82%,
    50% 100%,
    0% 82%,
    0% 12%
  );
  position: absolute;
  z-index: 25;
}

.shield-frame3 {
  width: 100%;
  aspect-ratio: 1 / 1.5;
  background: linear-gradient(45deg,
    #999 5%,
    #fff 10%,
    #ccc 30%,
    #ddd 50%,
    #ccc 70%,
    #fff 80%,
    #999 95%);
  clip-path: polygon(
    50% 0%,
    100% 12%,
    100% 82%,
    50% 100%,
    0% 82%,
    0% 12%
  );
  position: absolute;
  z-index: 5;
}
.player-card-lg:hover .shield-frame4,
.player-card-xl:hover .shield-frame4 {
  width: 110%;
  aspect-ratio: 1 / 1.2;
  background: rgba(20, 130, 232, 0.5);
  position: absolute;
  z-index: 0;
  filter: blur(25px);
  border-radius: 30%;
}
/* ===============================
   카드 내부 콘텐츠
================================ */
.content-wrapper {
  position: relative;
  z-index: 5;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 17% 5% 0;
}

/* ===============================
   상단 팀 태그
================================ */
.tier-tag {
  padding: 5px 12px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  border: 1px solid #fff;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  font-family: "Pretendard Variable";
}

.tier-text {
  font-weight: 800;
  font-size: 0.7rem;
  color: #0055ff;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* ===============================
   스탯 오브
================================ */
.stat-box {
  width: 22%;
  aspect-ratio: 1;
  background: radial-gradient(circle at 30% 30%, #aaccff, #0055ff);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Outfit', sans-serif;
  color: #f5f7fa;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(0,0,0,0.9);
  position: absolute;
  top: -8%;
  z-index: 300;
  font-size: clamp(14px, 4vw, 26px);
  overflow: hidden;
}
.stat-box::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  border-radius: 50%;
  border: 5px solid rgba(255,255,255,0.3);
}

.p-stat {
  position: absolute;
  z-index: 500;
}
.stat-box::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    rgba(0, 0, 0, 0.2), 
    rgba(255, 255, 255, 0.5), 
    rgba(0, 0, 0, 0.1),
    rgba(255, 255, 255, 0.5),
    rgba(0, 0, 0, 0.2) 100%
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.player-card-xl .stat-box::before,
.player-card-lg:hover .stat-box::before {
  opacity: 1;
  animation: shine-rotate 6s linear infinite;
}

/* 내부 광택 회전 효과 */
@keyframes shine-rotate {
  from { transform: translateY(0deg); }
  to { transform: rotate(360deg); }
}
/* ===============================
   선수 이미지
================================ */
.player-visual {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  position: relative;
  overflow: hidden;
  height: 80px;
}

.p-img {
  height: 100%;
  object-fit: contain;
  transform: scale(var(--img-scale));
  transition: transform 0.3s ease;
}

/* ===============================
   하단 정보 플레이트
================================ */
.info-plate {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.p-name {
  font-weight: 900;
  font-size: 1.6rem;
  margin: 0;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.p-pos {
  font-size: 1rem;
  font-weight: 700;
  color: var(--line-color);
  border: 1px solid #fff;
  background: rgba(255, 255, 255, 0.75);
  padding: 3px 8px;
  border-radius: 6px;
  font-family: 'Oswald', sans-serif;
}

/* ===============================
   스탯 그리드
================================ */
.stats-grid {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  border-top: 2px solid #f3f3f3;
  padding-top: 15px;
  margin-top: 15px;
}

.stat-item {
  text-align: center;
}

.stat-item label {
  font-family: 'Oswald', sans-serif;
  display: block;
  font-size: 0.6rem;
  color: #949ea9;
  font-weight: 800;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.stat-item .val {
  font-family: 'Oswald', 'Pretendard Variable', sans-serif;
  font-size: 0.75rem;
  letter-spacing: -0.5px;
  color: #333333;
  white-space: nowrap;
}
.stat-item .val-nation {
  font-weight: 900;
}
.stat-item .val.val-pos {
  white-space: normal;
}
.p-grade {
  font-family: 'Oswald', 'Pretendard Variable', sans-serif;
  font-size: 1.5rem;
  letter-spacing: 2px;
  font-weight: 900;
  position: absolute;
  bottom: 11%;
  color: #fff;

}
/* ===============================
   SIZE VARIANTS
================================ */

/* SMALL (필드용) */
.player-card-sm {
  width: 100px;
}

/* MEDIUM */
.player-card-md {
}

/* LARGE (가챠) */
.player-card-lg {
  width: 250px;
}

/* XL (디테일) */
.player-card-xl {
  width: 400px;
}
.player-card-xl .stats-grid {
  padding-top: 20px;
  margin-top: 20px;
}
.player-card-xl .player-visual{
  height: 150px;
}
.player-card-xl .tier-text {
    font-size: 1.2rem;
}
.player-card-xl .p-stat {
  font-size: 2rem;
}
.player-card-xl .p-name{
  font-size: 2.4rem;
}
.player-card-xl .p-pos {
  font-size: 1.8rem;
}
.player-card-xl .stat-item label {
  font-size: 1.2rem;
  margin-bottom: 12px;
}
.player-card-xl .stat-item .val {
  font-size: 1.3rem;
}
.player-card-xl .p-pos {
  padding: 5px 10px;
}
/* ===============================
   모바일 대응
================================ */
.player-card-sm .tier-tag {
  padding: 2px 5px;
}
.player-card-sm .tier-text {
  font-size: 0.55rem;
  letter-spacing: -0px;
}
.player-card-sm .stats-grid {
  display: none;
}
.player-card-sm .player-visual {
  height: 45px;
}
.player-card-sm .stat-box {
  width: 27%;
  aspect-ratio: 1 / 1;
}
.player-card-sm .p-stat {
  font-size: 0.8rem;
}
.player-card-sm .p-name{
  font-size: 0.8rem;
}
.player-card-sm .p-pos {
  padding: 2px 5px;
  font-size: 0.8rem;
}
.player-card-sm .content-wrapper {
  gap: 5px;
  padding: 20% 7% 0;
}



.ace-card .shield-frame,
.ace-card .shield-frame3 {
  background-size: 400px 400px;
  background-image:
    repeating-linear-gradient(
      315deg,
      #92baff 0px,
      #92bcff 5%,
      #66abff 10%,
      #60aaff 15%
    );
  animation: tileMove 12s linear infinite;
}
.ace-card .shield-frame3 {
  background-image:
    repeating-linear-gradient(
      315deg,
      #92baff 0px,
      #92bcff 5%,
      #66abff 10%,
      #60aaff 15%
    );

}
.ace-card.player-card-sm .shield-frame,
.ace-card.player-card-sm .shield-frame3 {
  background-size: 100px 100px;
  animation: none;
}
.ace-card.player-card-lg:hover .shield-frame4,
.ace-card.player-card-xl:hover .shield-frame4 {
  background: rgba(20, 232, 232, 0.5);
}

@keyframes tileMove {
  from {
    background-position: 0px 0px;
  }
  to {
    /* background-size랑 정확히 동일 */
    background-position: 400px 400px;
  }
}
.ace-card .shield-frame2 {
  background: #ffffff;
  opacity: 0.5;
}
.ace-card .stat-item label {
  color: rgba(255,255,255,0.7);
}
.ace-card .p-name,
.ace-card .val {
  color: #05284e;
}
</style>