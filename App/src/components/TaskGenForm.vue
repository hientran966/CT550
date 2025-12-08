<template>
  <div class="ai-task">

    <!-- Trigger -->
    <span ref="triggerRef">
      <slot name="trigger"></slot>
    </span>

    <!-- Popup form -->
    <div 
      v-show="innerVisible"
      ref="panelRef"
      class="ai-panel"
    >
      <div class="label">Nhập số lượng task</div>

      <el-input
        v-model.number="taskCount"
        type="number"
        placeholder="VD: 5"
        min="1"
        style="margin-top:6px"
      />

      <el-button
        type="primary"
        size="small"
        class="mt-2 w-full"
        style="margin-top: 10px; width: 100%;"
        @click="confirm"
      >
        Tự động tạo task
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";

const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(["generate", "update:visible"]);

const triggerRef = ref(null);
const panelRef = ref(null);

const innerVisible = ref(props.visible);
watch(() => props.visible, v => {
  innerVisible.value = v;
  if (v) nextTick(() => positionPanel());
});
watch(innerVisible, v => emit("update:visible", v));

const taskCount = ref(1);

function confirm() {
  emit("generate", taskCount.value);
  innerVisible.value = false;
}

function positionPanel() {
  const trigger = triggerRef.value;
  const panel = panelRef.value;

  if (!trigger || !panel) return;

  const rect = trigger.getBoundingClientRect();

  panel.style.position = "fixed";
  panel.style.left = rect.left + "px";
  panel.style.top = rect.bottom + "px";
  panel.style.zIndex = 9999;
}

function handleClickOutside(e) {
  if (!innerVisible.value) return;
  if (!panelRef.value || panelRef.value.contains(e.target)) return;
  if (triggerRef.value && triggerRef.value.contains(e.target)) return;
  innerVisible.value = false;
}
document.addEventListener("click", handleClickOutside);

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.ai-panel {
  width: 220px;
  padding: 12px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.label {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}
</style>
