<template>
  <el-dialog
    v-model="visible"
    title="Thông Tin Dự Án"
    width="600px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-form :model="form" :rules="rules" ref="projectForm" label-width="120px">
      <el-form-item label="Tên dự án" prop="name">
        <el-input v-model="form.name" autocomplete="off" />
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
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Đến hạn" prop="end_date">
        <el-date-picker
          v-model="form.end_date"
          type="date"
          placeholder="Chọn ngày kết thúc"
          :disabled-date="(date) => {
            if (form.start_date && date < new Date(form.start_date)) return true;
            if (latestTaskEndDate && date < latestTaskEndDate) return true;
            return false;
          }"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Trạng thái" prop="status">
        <el-select
          v-model="form.status"
          placeholder="Chọn trạng thái"
          style="width: 100%"
        >
          <el-option label="Lên kế hoạch" value="Lên kế hoạch" />
          <el-option label="Chưa bắt đầu" value="Chưa bắt đầu" />
          <el-option label="Đang tiến hành" value="Đang tiến hành" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="submitForm">Lưu</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";

import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";

const taskStore = useTaskStore();
const projectStore = useProjectStore();

const latestTaskEndDate = computed(() => {
  const list = taskStore.getTasksByProject(props.projectId);
  if (!list?.length) return null;

  return list
    .map((t) => t.due_date)
    .filter(Boolean)
    .map((d) => new Date(d))
    .reduce((max, d) => (d > max ? d : max), null);
});

/* ================== PROPS & EMITS ================== */
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  projectId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "project-updated"]);

/* ================== DIALOG VISIBLE ================== */
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

/* ================== FORM ================== */
const projectForm = ref(null);

const form = reactive({
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "Lên kế hoạch",
});

/* ================== VALIDATION RULES ================== */
const rules = {
  name: [{ required: true, message: "Tiêu đề là bắt buộc", trigger: "blur" }],
  start_date: [
    {
      required: true,
      message: "Ngày bắt đầu là bắt buộc",
      trigger: "change",
    },
  ],
  end_date: [
    { required: true, message: "Ngày kết thúc là bắt buộc", trigger: "change" },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback();

        if (form.start_date && new Date(value) < new Date(form.start_date)) {
          return callback(new Error("Ngày kết thúc phải sau ngày bắt đầu"));
        }

        if (
          latestTaskEndDate.value &&
          new Date(value) < latestTaskEndDate.value
        ) {
          return callback(
            new Error(
              `Ngày kết thúc dự án không được trước hạn công việc cuối (${latestTaskEndDate.value.toLocaleDateString()})`
            )
          );
        }

        callback();
      },
      trigger: "change",
    },
  ],
};

/* ================== METHODS ================== */
function handleClose() {
  visible.value = false;
  resetForm();
}

async function loadProject() {
  const project = await projectStore.getProjectById(props.projectId);
  if (!project) return;

  form.name = project.name || "";
  form.description = project.description || "";
  form.start_date = project.start_date || "";
  form.end_date = project.end_date || "";
  form.status = project.status || "Lên kế hoạch";
}

/* ================== DATE FORMAT ================== */
function pad(n) {
  return String(n).padStart(2, "0");
}

function toSQLDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ================== SUBMIT ================== */
async function submitForm() {
  if (!projectForm.value) return;

  try {
    await projectForm.value.validate();

    const user = JSON.parse(localStorage.getItem("user"));

    const payload = {
      id: props.projectId,
      name: form.name,
      description: form.description,
      start_date: toSQLDate(form.start_date),
      end_date: toSQLDate(form.end_date),
      status: form.status,
      actor_id: user.id,
    };

    await projectStore.updateProject(payload);

    ElMessage.success("Cập nhật dự án thành công");
    visible.value = false;
    emit("project-updated");
  } catch (err) {
    console.error("Lỗi cập nhật dự án:", err);
    ElMessage.error("Lỗi cập nhật dự án");
  }
}

// ================== LIFE CYCLE ==================
onMounted(async () => {
  await loadProject();
});

watch(() => props.projectId, loadProject);
</script>
