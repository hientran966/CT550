<template>
  <div class="avatar-group">
    <template v-for="(userId, index) in visibleIds" :key="userId">
      <el-tooltip
        v-if="tooltips"
        placement="top"
        effect="light"
        :hide-after="0"
        raw-content
        :popper-class="'user-tooltip-popper'"
      >
        <template #content>
          <UserTooltip :user-id="userId" :project-id="props.projectId"/>
        </template>

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

    <el-avatar v-if="extraCount > 0" :size="size" class="extra-avatar">
      +{{ extraCount }}
    </el-avatar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";
import UserTooltip from "@/components/UserTooltip.vue";

const props = defineProps({
  userIds: { type: Array, required: true },
  userNameMap: { type: Object, default: () => ({}) },
  projectId: { type: Number},
  size: { type: [Number, String], default: 28 },
  max: { type: Number, default: 3 },
  tooltips: { type: Boolean, default: true },
});

const avatarsMap = ref({});
const namesMap = ref(props.userNameMap);

async function loadAvatars() {
  if (!props.userIds?.length) return;
  const uniqueIds = [...new Set(props.userIds)];
  const results = {};

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

function getAvatar(id) {
  return avatarsMap.value[id] || defaultAvatar;
}

const visibleIds = computed(() =>
  props.userIds.slice(0, props.max)
);
const extraCount = computed(
  () => Math.max(0, props.userIds.length - visibleIds.value.length)
);

watch(
  () => props.userIds,
  () => loadAvatars(),
  { immediate: true, deep: true }
);

watch(
  () => props.userNameMap,
  (val) => (namesMap.value = val || {}),
  { deep: true }
);
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
  cursor: pointer;
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
.el-popper.is-customized {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 0 !important;
}

.el-popper.is-customized .el-popper__arrow::before {
  background: linear-gradient(45deg, #b2e68d, #bce689);
  right: 0;
}
.user-tooltip-popper {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 0 !important;
}
</style>