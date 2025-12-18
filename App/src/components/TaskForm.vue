<template>
  <el-dialog
    v-model="visible"
    title="Thêm Công Việc Mới"
    width="500px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-form :model="form" :rules="rules" ref="taskForm" label-width="120px">
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

      <el-form-item label="Ưu tiên" prop="priority">
        <el-select
          v-model="form.priority"
          placeholder="Chọn ưu tiên"
          style="width: 100%"
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
          style="width: 100%"
        >
          <el-option
            v-for="user in users"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Ngày bắt đầu" prop="start_date">
        <el-date-picker
          v-model="form.start_date"
          type="date"
          placeholder="Chọn ngày bắt đầu"
          :disabled-date="
            (date) =>
              project &&
              (date < new Date(project.start_date) ||
                date > new Date(project.end_date))
          "
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Đến hạn" prop="due_date">
        <el-date-picker
          v-model="form.due_date"
          type="date"
          placeholder="Chọn ngày kết thúc"
          :disabled-date="
            (date) =>
              project &&
              (date < new Date(project.start_date) ||
                date > new Date(project.end_date) ||
                (form.start_date && date < new Date(form.start_date)))
          "
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="submitForm">Tạo</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import TaskService from "@/services/Task.service";
import MemberService from "@/services/Member.service";

import { useProjectStore } from "@/stores/projectStore";

const props = defineProps({
  modelValue: Boolean,
  projectId: Number,
  parentId: Number,
});

const emit = defineEmits(["update:modelValue", "task-added"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const projectStore = useProjectStore();

const project = computed(() =>
  projectStore.projects.find((p) => p.id === props.projectId)
);

const taskForm = ref();
const users = ref([]);

const form = reactive({
  title: "",
  description: "",
  start_date: "",
  due_date: "",
  total_quantity: null,
  priority: "medium",
  assignees: [],
});

function toDate(d) {
  if (!d) return null;
  return d instanceof Date ? d : new Date(d);
}

const validateStartDate = (rule, value, callback) => {
  if (!value || !project.value) return callback();

  const start = toDate(value);
  const projectStart = toDate(project.value.start_date);
  const projectEnd = toDate(project.value.end_date);

  if (start < projectStart || start > projectEnd) {
    callback(
      new Error(
        `Ngày bắt đầu phải trong khoảng ${project.value.start_date} → ${project.value.end_date}`
      )
    );
  } else {
    callback();
  }
};

const validateDueDate = (rule, value, callback) => {
  if (!value || !project.value) return callback();

  const due = toDate(value);
  const start = toDate(form.start_date);
  const projectStart = toDate(project.value.start_date);
  const projectEnd = toDate(project.value.end_date);

  if (due < projectStart || due > projectEnd) {
    return callback(
      new Error(
        `Ngày kết thúc phải trong khoảng ${project.value.start_date} → ${project.value.end_date}`
      )
    );
  }

  if (start && due < start) {
    return callback(new Error("Ngày kết thúc phải ≥ ngày bắt đầu"));
  }

  callback();
};

const rules = {
  title: [{ required: true, message: "Tiêu đề là bắt buộc", trigger: "blur" }],
  start_date: [
    { validator: validateStartDate, trigger: "change" },
  ],
  due_date: [
    { validator: validateDueDate, trigger: "change" },
  ],
};

async function fetchMembers() {
  try {
    if (!props.projectId) return;

    const response = await MemberService.getByProjectId(props.projectId);
    users.value = (response || []).map((m) => ({
      id: m.user_id,
      name: m.name,
    }));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thành viên:", error);
    ElMessage.error("Không thể tải danh sách thành viên");
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function toSQLDate(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function resetForm() {
  form.title = "";
  form.description = "";
  form.start_date = "";
  form.due_date = "";
  form.total_quantity = null;
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
      members: form.assignees,
    };

    if (props.parentId) {
      payload.parent_task_id = props.parentId;
    }

    await TaskService.createTask(payload);

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
