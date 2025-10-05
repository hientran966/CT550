<template>
  <el-dialog
    class="task-detail"
    v-model="visible"
    :title="task.title"
    width="60%"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <el-splitter>
      <el-splitter-panel size="70%">
        <h3>{{ task.title }}</h3>
        <p v-if="task.description" style="margin-bottom: 16px">
          {{ task.description }}
        </p>

        <el-table :data="tableData" border style="width: 100%" :show-header="false">
          <el-table-column prop="label" label="Thuộc tính" width="150" />

          <el-table-column label="Giá trị">
            <template #default="{ row }">
              <!-- Hiển thị chế độ xem -->
              <template v-if="editRow !== row.key">
                <span v-if="row.key === 'status'">
                  {{ statusLabel(task.status) }}
                </span>
                <span v-else-if="row.key === 'priority'">
                  {{ priorityLabel(task.priority) }}
                </span>
                <span v-else-if="row.key === 'date'">
                  {{ formatDate(task.start_date) }} →
                  {{ formatDate(task.due_date) }}
                </span>
                <span v-else-if="row.key === 'progress'">
                  {{ task.latest_progress ?? 0 }}%
                </span>
                <span v-else-if="row.key === 'assignee'">
                  {{
                    task.assignees?.map((a) => a.initials).join(", ") ||
                    "Chưa có"
                  }}
                </span>

                <el-button
                  size="small"
                  type="info"
                  @click="startEdit(row.key)"
                  link
                  :icon="EditPen"
                />
              </template>

              <!-- Chế độ chỉnh sửa -->
              <template v-else>
                <!-- Trạng thái -->
                <el-select
                  v-if="row.key === 'status'"
                  v-model="editCache.status"
                  placeholder="Chọn trạng thái"
                  size="small"
                >
                  <el-option label="Đang chờ" value="todo" />
                  <el-option label="Đang tiến hành" value="in_progress" />
                  <el-option label="Hoàn thành" value="done" />
                </el-select>

                <!-- Ưu tiên -->
                <el-select
                  v-else-if="row.key === 'priority'"
                  v-model="editCache.priority"
                  placeholder="Chọn ưu tiên"
                  size="small"
                >
                  <el-option label="Thấp" value="low" />
                  <el-option label="Trung Bình" value="medium" />
                  <el-option label="Cao" value="high" />
                </el-select>

                <!-- Ngày bắt đầu / kết thúc -->
                <template v-else-if="row.key === 'date'">
                  <el-date-picker
                    v-model="editCache.start_date"
                    type="date"
                    placeholder="Bắt đầu"
                    size="small"
                  />
                  →
                  <el-date-picker
                    v-model="editCache.due_date"
                    type="date"
                    placeholder="Kết thúc"
                    size="small"
                  />
                </template>

                <!-- Tiến độ -->
                <el-select
                  v-else-if="row.key === 'progress'"
                  v-model="editCache.latest_progress"
                  placeholder="Tiến độ"
                  size="small"
                >
                  <el-option label="0%" :value="0" />
                  <el-option label="10%" :value="10" />
                  <el-option label="20%" :value="20" />
                  <el-option label="30%" :value="30" />
                  <el-option label="40%" :value="40" />
                  <el-option label="50%" :value="50" />
                  <el-option label="60%" :value="60" />
                  <el-option label="70%" :value="70" />
                  <el-option label="80%" :value="80" />
                  <el-option label="90%" :value="90" />
                  <el-option label="100%" :value="100" />
                </el-select>

                <!-- Người được giao -->
                <span v-else>
                  {{
                    task.assignees?.map((a) => a.initials).join(", ") ||
                    "Chưa có"
                  }}
                </span>
                <el-button
                  size="small"
                  type="success"
                  @click="saveEdit(row.key)"
                  link
                  :icon="Check"
                />
                <el-button
                  size="small"
                  @click="cancelEdit"
                  link
                  :icon="Close"
                />
              </template>
            </template>
          </el-table-column>
        </el-table>

        <el-button
            style="margin-top: 16px"
            plain
            :icon="Upload"
        >
        Đính Kèm File
        </el-button>
      </el-splitter-panel>

      <el-splitter-panel :min="200"> temp </el-splitter-panel>
    </el-splitter>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Check, Close, EditPen, Upload } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: "low" | "medium" | "high";
  start_date?: string;
  due_date?: string;
  latest_progress?: number;
  assignees?: { id: number; initials: string }[];
}

const props = defineProps<{
  modelValue: boolean;
  task: Task;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:task", value: Task): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const task = computed({
  get: () => props.task,
  set: (val) => Object.assign(props.task, val),
});

const tableData = computed(() => [
  { key: "status", label: "Trạng thái" },
  { key: "priority", label: "Ưu tiên" },
  { key: "date", label: "Thời gian" },
  { key: "progress", label: "Tiến độ (%)" },
  { key: "assignee", label: "Người được giao" },
]);

const editRow = ref<string | null>(null);
const editCache = ref<Partial<Task>>({});

const startEdit = (key: string) => {
  editRow.value = key;
  editCache.value = { ...task.value };
};

const cancelEdit = () => {
  editRow.value = null;
  editCache.value = {};
};

const saveEdit = (key: string) => {
  const updated = { ...task.value, ...editCache.value };

  if (key === "date") {
    if (
      updated.start_date &&
      updated.due_date &&
      new Date(updated.start_date) > new Date(updated.due_date)
    ) {
      ElMessage("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
  }
  if (updated.start_date) {
    updated.start_date = new Date(updated.start_date).toISOString().split("T")[0];
  }
  if (updated.due_date) {
    updated.due_date = new Date(updated.due_date).toISOString().split("T")[0];
  }

  const updatedTask = { ...updated, changedField: key } as Task & { changedField: string };
  emit("update:task", updatedTask);
  editRow.value = null;
  visible.value = false;
};

const statusLabel = (val: string) =>
  val === "todo"
    ? "Đang chờ"
    : val === "in_progress"
    ? "Đang tiến hành"
    : "Hoàn thành";

const priorityLabel = (val: string) =>
  val === "low" ? "Thấp" : val === "medium" ? "Trung Bình" : "Cao";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.el-splitter-panel {
  padding: 12px;
}
.task-detail .el-table {
  margin-top: 12px;
}
.el-date-editor {
  width: 120px;
}
</style>
