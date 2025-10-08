<template>
  <el-table
    :data="editableProjects"
    style="width: 100%"
    :table-layout="'fixed'"
    ref="tableRef"
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
          <span @click.stop="startEditing(row, 'name')">{{ row.name }}</span>
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
          <span @click.stop="startEditing(row, 'start_date')">
            {{ formatDate(null, null, row.start_date) }}
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
          <span @click.stop="startEditing(row, 'end_date')">
            {{ formatDate(null, null, row.end_date) }}
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
            @click.stop="startEditing(row, 'status')"
          >
            {{ row.status }}
          </el-tag>
        </template>
      </template>
    </el-table-column>

    <!-- Quản lý -->
    <el-table-column prop="created_by" label="Quản lý" width="250">
      <template #default="{ row }">
        <el-avatar size="small">U</el-avatar>
        <span style="margin-left: 8px">{{ row.created_by }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import type { TableInstance } from "element-plus";
import { ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

interface Project {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by?: string;
}

const props = defineProps<{
  projects: Project[];
}>();

const emit = defineEmits<{
  (e: "update-project", payload: { id: number; [key: string]: any }): void;
}>();

const editableProjects = ref<Project[]>([]);

watch(
  () => props.projects,
  (newVal) => {
    editableProjects.value = newVal.map((p) => ({ ...p }));
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

  console.log("Cập nhật:", { id, [field]: value });

  editingRow.value = null;
  editingField.value = null;
};


const isEditing = (row: Project, field: string) => {
  return editingRow.value === row && editingField.value === field;
};

const filterTag = (value: string, row: Project) => {
  return row.status === value;
};

const onRowClick = (row: Project) => {
  router.push({ name: "tasks", params: { id: row.id } });
};

const formatDate = (_: any, __: any, cellValue: string) => {
  if (!cellValue) return "";
  const date = new Date(cellValue);
  return date.toLocaleDateString("vi-VN");
};
</script>