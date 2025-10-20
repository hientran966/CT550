<template>
  <el-header class="task-header" height="100px">
    <!-- Tiêu đề -->
    <div
      style="height: 40px; display: flex; flex-direction: column; width: 100%;"
    >
      <h3>{{ pageTitle }}</h3>
    </div>

    <el-divider />

    <!-- Thanh công cụ -->
    <div
      style="width: 100%; display: flex; justify-content: space-between; align-items: center;"
    >
      <!-- Bên trái -->
      <div class="left-section">
        <el-button type="primary" :icon="Plus" plain @click="emit('add')">
          <strong>Thêm mới</strong>
        </el-button>
      </div>

      <!-- Bên phải -->
      <div class="right-section" style="display: flex; align-items: center;">
        <el-input
          v-model="search"
          placeholder="Tìm kiếm..."
          size="small"
          :prefix-icon="Search"
          style="width: 180px; margin-right: 8px;"
        />

        <el-button :icon="Filter" circle style="margin-right: 8px;" />

        <!-- Nhóm avatar thành viên -->
        <AvatarGroup
          v-if="props.page === 'task' && memberIds.length"
          :user-ids="memberIds"
          :user-name-map="namesMap"
          :size="30"
          :max="4"
          :tooltips="true"
          style="margin-right: 8px; cursor: pointer;"
          @click="memberClick"
        />

        <!-- Menu thêm -->
        <el-dropdown>
          <el-button circle>
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>Thành viên</el-dropdown-item>
              <el-dropdown-item>Cài đặt</el-dropdown-item>
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
import MemberService from "@/services/Member.service";
import AvatarGroup from "./AvatarGroup.vue";

const search = ref("");

const props = defineProps<{
  page: "project" | "task" | "member" | "user";
  projectId?: number;
}>();

const emit = defineEmits<{
  (e: "add"): void;
  (e: "member-click"): void;
}>();

const titleMap: Record<string, string> = {
  project: "Danh sách Project",
  task: "Danh sách Task",
  member: "Danh sách thành viên",
  user: "Danh sách người dùng",
};

const pageTitle = computed(() => titleMap[props.page] || "Danh sách");

const memberIds = ref<number[]>([]);
const namesMap = ref<Record<number, string>>({});

async function loadMembers() {
  if (props.page !== "task" || !props.projectId) return;

  try {
    const members = await MemberService.getByProjectId(props.projectId);

    if (!Array.isArray(members)) return;

    memberIds.value = members.map((m: any) => m.user_id);
    namesMap.value = members.reduce((map: Record<number, string>, m: any) => {
      if (m.user_id != null) map[m.user_id] = m.name || "Người dùng";
      return map;
    }, {});
  } catch (err) {
    console.error("Lỗi tải danh sách thành viên:", err);
  }
}

function memberClick() {
  emit("member-click");
}

onMounted(loadMembers);
watch(() => props.projectId, loadMembers);
</script>

<style scoped>
.el-divider {
  margin: 0 !important;
}
</style>