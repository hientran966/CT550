<template>
    <el-dialog
        :visible.sync="visible"
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
                    autocomplete="off"
                    :rows="3"
                />
            </el-form-item>
            <el-form-item label="Đến hạn" prop="due_date">
                <el-date-picker
                    v-model="form.start_date"
                    type="date"
                    placeholder="Chọn ngày"
                    style="width: 100%;"
                />
                <el-date-picker
                    v-model="form.due_date"
                    type="date"
                    placeholder="Chọn ngày"
                    style="width: 100%;"
                />
            </el-form-item>
            <el-form-item label="Ưu tiên" prop="priority">
                <el-select v-model="form.priority" placeholder="Chọn ưu tiên" style="width: 100%;">
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
                        :value="user"
                    />
                </el-select>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>
<script lang="ts" setup>    
import { ref, reactive, watch, toRefs } from "vue";
import { ElMessage } from "element-plus";
import TaskService from "@/services/Task.service";

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
  assignees: User[];
}

const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "task-added"): void;
}>();
const visible = ref(props.visible);

watch(
  () => props.visible,
  (newVal) => {
    visible.value = newVal;
  }
);
watch(visible, (newVal) => {
  emit("update:visible", newVal);
  if (newVal) {
    resetForm();
  }
});
const taskForm = ref();
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
  priority: [
    { required: true, message: "Ưu tiên là bắt buộc", trigger: "change" },
  ],
};
const users = ref<User[]>([
  { id: 1, name: "Nguyễn Văn A" },
  { id: 2, name: "Trần Thị B" },
  { id: 3, name: "Lê Văn C" },
]);
function resetForm() {
  form.title = "";
  form.description = "";
  form.due_date = "";
  form.priority = "medium";
}
function handleClose() {
  visible.value = false;
}
async function submitForm() {
  if (!taskForm.value) return;
  try {
    await taskForm.value.validate();
    const payload = {
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        priority: form.priority,
        assignees: form.assignees.map((user) => user.id),
    };
    await TaskService.createTask(payload);
    ElMessage.success("Tạo công việc thành công");
    visible.value = false;
    emit("task-added");
  } catch (err) {
    console.error("Lỗi tạo công việc:", err);
    ElMessage.error("Lỗi tạo công việc");
  }
}

</script>