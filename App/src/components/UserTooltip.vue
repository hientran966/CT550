<template>
  <el-card class="user-tooltip-card" shadow="hover">
    <div class="tooltip-header">
      <el-avatar :size="60" :src="avatarUrl" />
      <div class="tooltip-info">
        <div class="user-name">{{ user.name || "—" }}</div>
        <div class="user-email">{{ user.email || "—" }}</div>
        <el-tag v-if="user.role" size="small">{{ stats.role }}</el-tag>
      </div>
    </div>

    <el-divider />

    <div class="tooltip-stats">
      <div class="stat-item">
        <div class="stat-number">{{ stats.tasks ?? 0 }}</div>
        <div class="stat-label">Tasks</div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import AccountService from "@/services/Account.service";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true,
  },
  projectId: {
    type: [String, Number],
    required: true,
  },
});

const user = ref({});
const stats = ref({});
const avatarUrl = ref(defaultAvatar);

async function loadAvatar() {
  try {
    const res = await FileService.getAvatar(props.userId);
    avatarUrl.value = res?.file_url || defaultAvatar;
  } catch {
    avatarUrl.value = defaultAvatar;
  }
}

async function fetchData() {
  try {
    const [userRes, statsRes] = await Promise.all([
      AccountService.getAccountById(props.userId),
      AccountService.getStats(props.userId, props.projectId),
    ]);
    user.value = userRes;
    stats.value = statsRes || {};
    await loadAvatar();
  } catch (err) {
    console.error(err);
  }
}

onMounted(fetchData);
watch(() => props.userId, fetchData);
</script>

<style scoped>
.user-tooltip-card {
  width: 250px;
  border-radius: 10px;
  border: none !important;
  box-shadow: none !important;
}


.tooltip-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tooltip-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
}

.user-email {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.tooltip-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  flex: 1;
}

.stat-number {
  font-weight: bold;
  color: var(--el-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
