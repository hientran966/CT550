<template>
  <el-table
    :data="editableProjects"
    style="width: 100%"
    :table-layout="'fixed'"
    ref="tableRef"
    @row-click="onRowClick"
  >
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
          <span @click.stop="startEditing(row, 'name')">{{ row.name }}</span>
        </template>
      </template>
    </el-table-column>

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
          <span @click.stop="startEditing(row, 'start_date')">
            {{ formatDate(null, null, row.start_date) }}
          </span>
        </template>
      </template>
    </el-table-column>

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
          <span @click.stop="startEditing(row, 'end_date')">
            {{ formatDate(null, null, row.end_date) }}
          </span>
        </template>
      </template>
    </el-table-column>

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
            @click.stop="startEditing(row, 'status')"
          >
            {{ row.status }}
          </el-tag>
        </template>
      </template>
    </el-table-column>

    <el-table-column prop="created_by" label="Quản lý" width="220">
      <template #default="{ row }">
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-avatar
            :src="getManagerAvatar(row.created_by)"
            size="small"
          />
        </div>
      </template>
    </el-table-column>

    <el-table-column prop="members" label="Thành viên" width="180">
      <template #default="{ row }">
        <AvatarGroup :user-ids="row.members || []" :max="3" :size="28" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import type { TableInstance } from "element-plus";
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import AvatarGroup from "@/components/AvatarGroup.vue";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";

const router = useRouter();

interface Project {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by?: number;
  members?: number[];
}

const props = defineProps<{
  projects: Project[];
}>();

const emit = defineEmits<{
  (e: "update-project", payload: { id: number; [key: string]: any }): void;
}>();

const editableProjects = ref<Project[]>([]);
const managerAvatars = ref<Record<number, string>>({});
const managerNames = ref<Record<number, string>>({});

watch(
  () => props.projects,
  async (newVal) => {
    editableProjects.value = newVal.map((p) => ({ ...p }));
    await loadManagerAvatars(newVal);
  },
  { immediate: true }
);

const tableRef = ref<TableInstance>();
const statusFilters = [
  { text: "Chưa bắt đầu", value: "Chưa bắt đầu" },
  { text: "Đang tiến hành", value: "Đang tiến hành" },
  { text: "Đã hoàn thành", value: "Đã hoàn thành" },
];

const editingRow = ref<Project | null>(null);
const editingField = ref<string | null>(null);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toSQLDate(value: Date | string) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const startEditing = (row: Project, field: string) => {
  editingRow.value = row;
  editingField.value = field;
};

const stopEditing = () => {
  if (!editingRow.value || !editingField.value) return;

  const field = editingField.value;
  const id = editingRow.value.id;
  let value = (editingRow.value as any)[field];

  if (field === "start_date" || field === "end_date") {
    value = toSQLDate(value);
    (editingRow.value as any)[field] = value;
  }

  emit("update-project", { id, [field]: value });

  editingRow.value = null;
  editingField.value = null;
};

const isEditing = (row: Project, field: string) =>
  editingRow.value === row && editingField.value === field;

const filterTag = (value: string, row: Project) => row.status === value;

const onRowClick = (row: Project) => {
  router.push({ name: "tasks", params: { id: row.id } });
};

const formatDate = (_: any, __: any, cellValue: string) => {
  if (!cellValue) return "";
  const date = new Date(cellValue);
  return date.toLocaleDateString("vi-VN");
};

async function loadManagerAvatars(projects: Project[]) {
  const uniqueIds = Array.from(new Set(projects.map((p) => p.created_by)));
  const results: Record<number, string> = {};

  await Promise.all(
    uniqueIds.map(async (id) => {
      if (!id) return;
      try {
        const res = await FileService.getAvatar(id);
        results[id] = res?.file_url || defaultAvatar;
      } catch {
        results[id] = defaultAvatar;
      }
    })
  );

  managerAvatars.value = results;
}

function getManagerAvatar(id: number) {
  return managerAvatars.value[id] || defaultAvatar;
}

function getManagerName(id: number) {
  return `User ${id}`;
}
</script>