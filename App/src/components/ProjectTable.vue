<template>
  <div>
    <el-table
      :data="pagedProjects"
      style="width: 100%"
      :table-layout="'fixed'"
      ref="tableRef"
      :height="'610px'"
      @row-click="onRowClick"
    >
      <!-- Tên dự án -->
      <el-table-column prop="name" label="Tên dự án">
        <template #default="{ row }">
          <template v-if="isEditing(row, 'name')">
            <el-input
              v-model="row.name"
              size="small"
              @blur="stopEditing"
              @keyup.enter="stopEditing"
              @click.stop=""
              autofocus
            />
          </template>
          <template v-else>
            <span
              :class="{ 'disabled-text': !canEditProject(row.id) }"
              @click.stop="startEditing(row, 'name')"
            >
              {{ row.name }}
            </span>
          </template>
        </template>
      </el-table-column>

      <!-- Ngày bắt đầu -->
      <el-table-column prop="start_date" label="Ngày bắt đầu" sortable>
        <template #default="{ row }">
          <template v-if="isEditing(row, 'start_date')">
            <el-date-picker
              v-model="row.start_date"
              type="date"
              size="small"
              @change="stopEditing"
              @click.stop=""
            />
          </template>
          <template v-else>
            <span
              :class="{ 'disabled-text': !canEditProject(row.id) }"
              @click.stop="startEditing(row, 'start_date')"
            >
              {{ formatDate(row.start_date) }}
            </span>
          </template>
        </template>
      </el-table-column>

      <!-- Ngày kết thúc -->
      <el-table-column prop="end_date" label="Ngày kết thúc" sortable>
        <template #default="{ row }">
          <template v-if="isEditing(row, 'end_date')">
            <el-date-picker
              v-model="row.end_date"
              type="date"
              size="small"
              @change="stopEditing"
              @click.stop=""
            />
          </template>
          <template v-else>
            <span
              :class="{ 'disabled-text': !canEditProject(row.id) }"
              @click.stop="startEditing(row, 'end_date')"
            >
              {{ formatDate(row.end_date) }}
            </span>
          </template>
        </template>
      </el-table-column>

      <!-- Trạng thái -->
      <el-table-column
        prop="status"
        label="Trạng thái"
        :filters="statusFilters"
        :filter-method="filterTag"
      >
        <template #default="{ row }">
          <template v-if="isEditing(row, 'status')">
            <el-select
              v-model="row.status"
              size="small"
              @change="stopEditing"
              @click.stop=""
            >
              <el-option label="Chưa bắt đầu" value="Chưa bắt đầu" />
              <el-option label="Đang tiến hành" value="Đang tiến hành" />
              <el-option label="Đã hoàn thành" value="Đã hoàn thành" />
            </el-select>
          </template>
          <template v-else>
            <el-tag
              :type="row.status === 'Đang tiến hành' ? 'primary' : 'success'"
              disable-transitions
              :class="{ 'disabled-text': !canEditProject(row.id) }"
              @click.stop="startEditing(row, 'status')"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </template>
      </el-table-column>

      <!-- Thành viên -->
      <el-table-column prop="members" label="Thành viên" width="180">
        <template #default="{ row }">
          <AvatarGroup
            :user-ids="projectMembers[row.id] || []"
            :project-id="row.id"
            :max="3"
            :size="28"
          />
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div style="display: flex; justify-content: center; margin-top: 16px">
      <el-pagination
        background
        layout="prev, pager, next, jumper"
        :total="editableProjects.length"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useRoleStore } from "@/stores/roleStore";

import AvatarGroup from "@/components/AvatarGroup.vue";
import FileService from "@/services/File.service";
import AccountService from "@/services/Account.service";
import MemberService from "@/services/Member.service";
import defaultAvatar from "@/assets/default-avatar.png";

const router = useRouter();
const roleStore = useRoleStore();

const props = defineProps({
  projects: { type: Array, required: true },
});

const emit = defineEmits(["update-project"]);

const editableProjects = ref([]);
const projectMembers = ref({});
const managerAvatars = ref({});
const managerNames = ref({});
const projectRoles = ref({});

// ------------------ PHÂN TRANG ------------------
const currentPage = ref(1);
const pageSize = ref(13);

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return editableProjects.value.slice(start, end);
});

function handlePageChange(page) {
  currentPage.value = page;
}

// ------------------ TRẠNG THÁI / EDIT ------------------
const tableRef = ref(null);
const statusFilters = [
  { text: "Chưa bắt đầu", value: "Chưa bắt đầu" },
  { text: "Đang tiến hành", value: "Đang tiến hành" },
  { text: "Đã hoàn thành", value: "Đã hoàn thành" },
];

const editingRow = ref(null);
const editingField = ref(null);

function pad(n) {
  return String(n).padStart(2, "0");
}

function toSQLDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function canEditProject(projectId) {
  const role = projectRoles.value[projectId];
  return ["owner", "manager"].includes(role);
}

function startEditing(row, field) {
  if (!canEditProject(row.id)) return;
  editingRow.value = row;
  editingField.value = field;
}

function stopEditing() {
  if (!editingRow.value || !editingField.value) return;
  const field = editingField.value;
  const id = editingRow.value.id;
  let value = editingRow.value[field];

  if (field === "start_date" || field === "end_date") {
    value = toSQLDate(value);
    editingRow.value[field] = value;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  emit("update-project", { id, [field]: value, actor_id: user?.id });
  editingRow.value = null;
  editingField.value = null;
}

function isEditing(row, field) {
  return editingRow.value === row && editingField.value === field;
}

function filterTag(value, row) {
  return row.status === value;
}

function onRowClick(row) {
  router.push({ name: "tasks", params: { id: row.id } });
}

function formatDate(cellValue) {
  if (!cellValue) return "";
  const date = new Date(cellValue);
  return date.toLocaleDateString("vi-VN");
}

// ------------------ DỮ LIỆU PHỤ TRỢ ------------------
async function loadManagerData(projects) {
  const uniqueIds = Array.from(new Set(projects.map((p) => p.created_by)));
  const avatars = {};
  const names = {};

  await Promise.all(
    uniqueIds.map(async (id) => {
      if (!id) return;
      try {
        const [avatarRes, accountRes] = await Promise.all([
          FileService.getAvatar(id),
          AccountService.getAccountById(id),
        ]);

        avatars[id] = avatarRes?.file_url || defaultAvatar;
        names[id] = accountRes?.name || "Người dùng";
      } catch {
        avatars[id] = defaultAvatar;
        names[id] = "Người dùng";
      }
    })
  );

  managerAvatars.value = avatars;
  managerNames.value = names;
}

async function loadMembers(projects) {
  if (!projects || !Array.isArray(projects)) return;
  const membersMap = {};

  await Promise.all(
    projects.map(async (p) => {
      try {
        const members = await MemberService.getByProjectId(p.id);
        if (Array.isArray(members)) {
          membersMap[p.id] = members.map((m) => m.user_id);
        } else {
          membersMap[p.id] = [];
        }
      } catch (err) {
        console.error(`Lỗi tải thành viên cho project ${p.id}:`, err);
        membersMap[p.id] = [];
      }
    })
  );

  projectMembers.value = membersMap;
}

function getManagerAvatar(id) {
  return managerAvatars.value[id] || defaultAvatar;
}

function getManagerName(id) {
  return managerNames.value[id] || "Đang tải...";
}

// ------------------ LOAD DỮ LIỆU ------------------
watch(
  () => props.projects,
  async (newVal) => {
    await nextTick();
    editableProjects.value = newVal.map((p) => ({ ...p }));
    await loadManagerData(newVal);
    await loadMembers(newVal);

    const roles = {};
    await Promise.all(
      newVal.map(async (p) => {
        try {
          const res = await roleStore.fetchProjectRole(p.id);
          roles[p.id] = res.role;
        } catch {
          roles[p.id] = "viewer";
        }
      })
    );
    projectRoles.value = roles;
  },
  { immediate: true }
);
</script>

<style scoped>
.el-table__body tr.is-empty-row td {
  border-bottom: none !important;
  background: transparent !important;
}

.disabled-text {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>