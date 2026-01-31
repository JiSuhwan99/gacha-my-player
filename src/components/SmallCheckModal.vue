<template>
  <div class="small-check-modal-overlay" @click.self="$emit('cancel')">
    <div class="small-check-modal">
      
      <h3 v-if="title" class="modal-title">
        {{ title }}
      </h3>

      <p class="modal-message">
        <slot />
      </p>

      <div class="modal-actions">
        <button
          v-if="cancelText"
          class="btn cancel"
          @click="$emit('cancel')"
          >
          {{ cancelText }}
        </button>
        <button
          class="btn confirm"
          :class="{ danger }"
          @click="$emit('confirm')"
          >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SmallCheckModal",
  props: {
    title: {
      type: String,
      default: "",
    },
    confirmText: {
      type: String,
      default: "확인",
    },
    cancelText: {
      type: String,
      default: "취소",
    },
    danger: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style>
.small-check-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 99999;

  display: flex;
  align-items: center;
  justify-content: center;
}

.small-check-modal {
  width: 320px;
  padding: 20px;
  background: #111;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

  color: #fff;
  text-align: center;
}

.modal-message {
  margin-bottom: 20px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-actions .btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.modal-actions .btn.cancel {
  background: #444;
  color: #fff;
}

.modal-actions .btn.confirm {
  background: #e74c3c;
  color: #fff;
}

</style>
