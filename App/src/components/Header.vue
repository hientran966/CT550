<template>
  <el-header class="task-header" height="100px">
    <div
      style="height: 40px; display: flex; flex-direction: column; width: 100%;"
    >
      <h3>{{ pageTitle }}</h3>
    </div>
    <el-divider />
    <div
      style="width: 100%; display: flex; justify-content: space-between; align-items: center;"
    >
      <div class="left-section">
        <el-button type="primary" :icon="Plus" plain @click="emit('add')">
          <strong>Thêm mới</strong>
        </el-button>
      </div>

      <div class="right-section" style="display: flex; align-items: center;">
        <el-input
          v-model="search"
          placeholder="Search..."
          size="small"
          :prefix-icon="Search"
          style="width: 180px; margin-right: 8px;"
        />
        <el-button :icon="Filter" circle style="margin-right: 8px;" />

        <!-- ✅ AvatarGroup hiển thị danh sách thành viên -->
        <template v-if="props.page === 'task' && memberIds.length">
          <AvatarGroup
            :user-ids="memberIds"
            :size="30"
            :max="4"
            :tooltips="true"
            style="margin-right: 8px;"
          />
        </template>

        <el-dropdown>
          <el-button circle>
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>Settings</el-dropdown-item>
              <el-dropdown-item>Logout</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-header>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { Plus, Search, Filter, More } from "@element-plus/icons-vue";
import ProjectService from "@/services/Project.service";
import AvatarGroup from "./AvatarGroup.vue";

const search = ref("");

const props = defineProps<{
  page: string;
  projectId?: number;
}>();

const emit = defineEmits<{
  (e: "add"): void;
}>();

const titleMap: Record<string, string> = {
  project: "Danh sách dự án",
  task: "Danh sách công việc",
  member: "Danh sách thành viên",
  user: "Danh sách người dùng",
};

const pageTitle = computed(() => titleMap[props.page] || "Danh sách");

const memberIds = ref<number[]>([]);

async function loadMembers() {
  if (props.page !== "task" || !props.projectId) return;
  try {
    const members = await ProjectService.getMember(props.projectId);
    memberIds.value = members.map((m: any) => m.id);
  } catch (err) {
    console.error("Lỗi tải danh sách thành viên:", err);
  }
}

onMounted(loadMembers);
watch(() => props.projectId, loadMembers);
</script>

<style scoped>
.el-divider {
  margin: 0 !important;
}
</style>