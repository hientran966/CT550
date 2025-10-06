<template>
  <el-dialog
    v-model="visible"
    title="Thêm Công Việc Mới"
    width="500px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="taskForm"
      label-width="120px"
    >
      <el-form-item label="Tiêu đề" prop="title">
        <el-input v-model="form.title" autocomplete="off" />
      </el-form-item>

      <el-form-item label="Mô tả" prop="description">
        <el-input
          type="textarea"
          v-model="form.description"
          :rows="3"
          autocomplete="off"
        />
      </el-form-item>

      <el-form-item label="Ngày bắt đầu" prop="start_date">
        <el-date-picker
          v-model="form.start_date"
          type="date"
          placeholder="Chọn ngày bắt đầu"
          style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="Đến hạn" prop="due_date">
        <el-date-picker
          v-model="form.due_date"
          type="date"
          placeholder="Chọn ngày kết thúc"
          style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="Ưu tiên" prop="priority">
        <el-select
          v-model="form.priority"
          placeholder="Chọn ưu tiên"
          style="width: 100%;"
        >
          <el-option label="Cao" value="high" />
          <el-option label="Trung Bình" value="medium" />
          <el-option label="Thấp" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="Người được giao" prop="assignees">
        <el-select
          v-model="form.assignees"
          multiple
          placeholder="Chọn người được giao"
          style="width: 100%;"
        >
          <el-option
            v-for="user in users"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="submitForm">Tạo</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import TaskService from "@/services/Task.service";
import ProjectService from "@/services/Project.service";
import AssignService from "@/services/Assign.service";

interface User {
  id: number;
  name: string;
}

interface TaskForm {
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  priority: "low" | "medium" | "high";
  assignees: number[];
}

const props = defineProps<{
  modelValue: boolean;
  projectId: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "task-added"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit("update:modelValue", val),
});

const taskForm = ref();
const users = ref<User[]>([]);

const form = reactive<TaskForm>({
  title: "",
  description: "",
  start_date: "",
  due_date: "",
  priority: "medium",
  assignees: [],
});

const rules = {
  title: [{ required: true, message: "Tiêu đề là bắt buộc", trigger: "blur" }],
  start_date: [
    { required: true, message: "Ngày bắt đầu là bắt buộc", trigger: "change" },
  ],
  due_date: [
    { required: true, message: "Ngày kết thúc là bắt buộc", trigger: "change" },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value) {
          return callback(new Error("Ngày kết thúc là bắt buộc"));
        }
        if (form.start_date && new Date(value) < new Date(form.start_date)) {
          return callback(new Error("Ngày kết thúc phải sau ngày bắt đầu"));
        }
        callback();
      },
      trigger: "change",
    },
  ],
  priority: [
    { required: true, message: "Ưu tiên là bắt buộc", trigger: "change" },
  ],
};

async function fetchMembers() {
  try {
    if (!props.projectId) return;

    const response = await ProjectService.getMember(props.projectId);
    users.value = response || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thành viên:", error);
    ElMessage.error("Không thể tải danh sách thành viên");
  }
}

type DateOrString = Date | string | undefined | null;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toSQLDate(value: DateOrString): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function resetForm() {
  form.title = "";
  form.description = "";
  form.start_date = "";
  form.due_date = "";
  form.priority = "medium";
  form.assignees = [];
}

function handleClose() {
  visible.value = false;
  resetForm();
}

onMounted(() => {
  fetchMembers();
});

async function submitForm() {
  if (!taskForm.value) return;
  try {
    await taskForm.value.validate();

    const user = JSON.parse(localStorage.getItem("user"));

    const payload = {
      project_id: props.projectId,
      title: form.title,
      description: form.description,
      start_date: toSQLDate(form.start_date),
      due_date: toSQLDate(form.due_date),
      priority: form.priority,
      created_by: user.id,
    };

    console.log("Payload:", payload);
    const createdTask = await TaskService.createTask(payload);
    const taskId = createdTask.id;

    for (const userId of form.assignees) {
      await AssignService.createAssign({
        task_id: taskId,
        user_id: userId,
      });
    }

    ElMessage.success("Tạo công việc thành công");
    visible.value = false;
    emit("task-added");
    resetForm();
  } catch (err) {
    console.error("Lỗi tạo công việc:", err);
    ElMessage.error("Lỗi tạo công việc");
  }
}
</script>
