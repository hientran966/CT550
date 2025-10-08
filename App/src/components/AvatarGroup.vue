<template>
  <div class="avatar-group">
    <template v-for="(userId, index) in visibleIds" :key="userId">
      <el-tooltip
        v-if="tooltips"
        :content="getUserName(userId)"
        placement="top"
      >
        <el-avatar
          :src="getAvatar(userId)"
          :size="size"
          :style="{ zIndex: visibleIds.length - index }"
        />
      </el-tooltip>
      <el-avatar
        v-else
        :src="getAvatar(userId)"
        :size="size"
        :style="{ zIndex: visibleIds.length - index }"
      />
    </template>

    <el-avatar
      v-if="extraCount > 0"
      :size="size"
      class="extra-avatar"
    >
      +{{ extraCount }}
    </el-avatar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";

// ✅ Props
const props = defineProps<{
  userIds: number[];
  size?: number | string;
  max?: number;
  tooltips?: boolean;
}>();

const size = props.size || 28;
const maxVisible = props.max || 3;
const tooltips = props.tooltips ?? true;

const avatarsMap = ref<Record<number, string>>({});
const namesMap = ref<Record<number, string>>({});

async function loadAvatars() {
  const uniqueIds = Array.from(new Set(props.userIds));

  const results: Record<number, string> = {};
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const res = await FileService.getAvatar(id);
        results[id] = res?.file_url || defaultAvatar;
      } catch {
        results[id] = defaultAvatar;
      }
    })
  );
  avatarsMap.value = results;
}

function getAvatar(id: number) {
  return avatarsMap.value[id] || defaultAvatar;
}

function getUserName(id: number) {
  return `User ${id}`;
}

watch(
  () => props.userIds,
  () => loadAvatars(),
  { deep: true, immediate: true }
);

const visibleIds = computed(() => props.userIds.slice(0, maxVisible));
const extraCount = computed(() => props.userIds.length - visibleIds.value.length);
</script>

<style scoped>
.avatar-group {
  display: flex;
  align-items: center;
}
.avatar-group .el-avatar {
  border: 2px solid #fff;
  margin-left: -8px;
  transition: transform 0.2s ease;
}
.avatar-group .el-avatar:first-child {
  margin-left: 0;
}
.avatar-group .el-avatar:hover {
  transform: scale(1.1);
  z-index: 100;
}
.extra-avatar {
  background-color: #dcdfe6;
  color: #606266;
  font-weight: bold;
}
</style>
