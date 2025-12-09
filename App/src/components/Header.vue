<template>
  <el-header class="task-header" height="100px">
    <!-- Tiêu đề -->
    <div style="height: 40px; display: flex; flex-direction: row; width: 100%;">
      <el-button v-if="props.page === 'task'" text style="margin-top: 10px;" @click="onToggle">
        <el-icon size="large">
          <component :is="isExpanded ? Expand : Fold" />
        </el-icon>
      </el-button>
      <el-divider direction="vertical" />
      <h3 class="page-title">{{ pageTitle }}</h3>
    </div>

    <el-divider />

    <!-- Thanh công cụ -->
    <div
      style="width: 100%; display: flex; justify-content: space-between; align-items: center;"
    >
      <!-- Bên trái -->
      <div class="left-section">
        <el-button
          v-if="canAdd"
          type="primary"
          :icon="Plus"
          plain
          @click="emit('add')"
        >
          <strong>Thêm mới</strong>
        </el-button>
        <AiTaskGen v-model:visible="aiGenVisible" @generate="emit('ai-gen', $event)">
          <template #trigger>
            <el-button
              type="primary"
              :icon="MagicStick"
              plain
              @click="aiGenVisible = true"
            />
          </template>
        </AiTaskGen>
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

        <!-- Nút mở Drawer -->
        <el-button
          v-if="props.page === 'task'"
          :icon="Filter"
          circle
          @click="drawerVisible = true"
          style="margin-right: 8px;"
        />

        <!-- Drawer Bộ lọc -->
        <el-drawer
          v-model="drawerVisible"
          title="Bộ lọc công việc"
          size="300px"
          direction="rtl"
        >
          <div class="filter-section">
            <!-- Nhãn -->
            <div class="filter-item">
              <label>Nhãn</label>
              <el-select
                v-model="filters.priority"
                placeholder="Chọn nhãn"
                clearable
                style="width: 100%; margin-top: 4px;"
              >
                <el-option label="Tất cả" value=""></el-option>
                <el-option label="Thấp" value="low"></el-option>
                <el-option label="Trung bình" value="medium"></el-option>
                <el-option label="Cao" value="high"></el-option>
              </el-select>
            </div>

            <!-- Thành viên -->
            <div class="filter-item">
              <label>Người phụ trách</label>
              <el-select
                v-model="filters.assignees"
                placeholder="Chọn người phụ trách"
                clearable
                style="width: 100%; margin-top: 4px;"
              >
                <el-option
                  v-for="id in memberIds"
                  :key="id"
                  :label="namesMap[id]"
                  :value="id"
                />
              </el-select>
            </div>

            <div style="margin-top: 16px; text-align: right;">
              <el-button size="small" @click="resetFilter">Đặt lại</el-button>
              <el-button size="small" type="primary" @click="applyFilter">Áp dụng</el-button>
            </div>
          </div>
        </el-drawer>

        <!-- Nhóm avatar -->
        <AvatarGroup
          v-if="props.page === 'task' && memberIds.length"
          :user-ids="memberIds"
          :project-id="props.projectId"
          :user-name-map="namesMap"
          :size="30"
          :max="4"
          :tooltips="true"
          style="margin-right: 8px; cursor: pointer;"
          @click="memberClick"
        />
        <el-dropdown v-if="props.page === 'task'" trigger = "click">
          <el-button circle style="border:none;">
            <el-icon><MoreFilled /></el-icon>
          </el-button>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="confirmDeleteProject">
                <el-icon style="margin-right:6px;"><Delete /></el-icon>
                Xóa dự án
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Plus, Search, Filter, MagicStick, Fold, Expand, MoreFilled, Delete } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

import { useProjectStore } from "@/stores/projectStore";
import { useTaskStore } from "@/stores/taskStore";
import { useRoleStore } from "@/stores/roleStore";

import AvatarGroup from "./AvatarGroup.vue";
import AiTaskGen from "./TaskGenForm.vue"; 

// ----------- PROPS & EMIT -----------
const props = defineProps({
  page: { type: String, required: true },
  projectId: { type: Number, required: false },
  members: { type: Array, default: () => [] },
});
const emit = defineEmits(["add", "ai-gen", "member-click", "toggle-menu"]);

// ----------- STATE -----------
const search = ref("");
const isExpanded = ref(true);
const drawerVisible = ref(false);
const aiGenVisible = ref(false);
const filters = ref({
  priority: "",
  assignees: null,
});

// ----------- STORE -----------
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const roleStore = useRoleStore();

// ----------- TITLE -----------
const projectName = computed(() => {
  if (props.page !== "task" || !props.projectId) return "";
  const project = projectStore.projects?.find((p) => p.id === props.projectId);
  return project ? project.name : "";
});
const titleMap = {
  project: "Danh sách Project",
  task: "Danh sách Task",
  member: "Danh sách thành viên",
  user: "Danh sách người dùng",
};
const pageTitle = computed(() =>
  props.page === "task" && projectName.value
    ? projectName.value
    : titleMap[props.page] || "Danh sách"
);

// ----------- MEMBERS -----------
const memberIds = computed(() => props.members.map(m => m.user_id));
const namesMap = computed(() =>
  Object.fromEntries(props.members.map(m => [m.user_id, m.name || "Người dùng"]))
);

// ----------- ROLE CHECK -----------
const canAdd = ref(false);
async function checkRole() {
  if (props.page === "project") {
    canAdd.value = true;
    return;
  }
  if (!props.projectId) {
    canAdd.value = false;
    return;
  }
  try {
    const projectRole = await roleStore.fetchProjectRole(props.projectId);
    canAdd.value = ["owner", "manager"].includes(projectRole.role);
  } catch {
    canAdd.value = false;
  }
}

// ----------- FILTER LOGIC -----------
function applyFilter() {
  if (props.page === "task") {
    taskStore.setPriorityFilter(filters.value.priority || null);
    taskStore.setAssigneeFilter(filters.value.assignees || null);
  }
  drawerVisible.value = false;
}

function resetFilter() {
  filters.value = { priority: "", assignees: null };
  if (props.page === "task") {
    taskStore.setPriorityFilter(null);
    taskStore.setAssigneeFilter(null);
  }
}

// ----------- EVENTS -----------
function onToggle() {
  isExpanded.value = !isExpanded.value;
  emit("toggle-menu");
}

function memberClick() {
  emit("member-click");
}

async function confirmDeleteProject() {
  try {
    await ElMessageBox.confirm(
      "Bạn có chắc muốn xóa dự án này? Thao tác không thể hoàn tác.",
      "Xác nhận",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "danger",
      }
    );

    emit("delete-project", props.projectId);
  } catch {

  }
}

// ----------- LIFECYCLE -----------
onMounted(async () => {
  if (!projectStore.projects?.length && props.projectId) {
    projectStore.fetchProjects?.();
  }
  await checkRole();
  console.log("load",props.members)
});

watch(() => props.projectId, async () => {
  await checkRole();
});

watch(search, (val) => {
  if (props.page === "project") projectStore.setSearch(val);
  else if (props.page === "task") taskStore.setSearch(val);
});
</script>

<style scoped>
.el-divider {
  margin: 0 !important;
}
.page-title {
  margin-left: 20px;
}
.filter-section {
  padding: 10px;
}
.filter-item {
  margin-bottom: 12px;
}
.filter-item label {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}
</style>