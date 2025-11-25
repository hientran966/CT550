<template>
  <el-dialog
    v-model="visible"
    title="Thêm Nhóm Chat Mới"
    width="500px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-form :model="form" :rules="rules" ref="channelForm" label-width="120px">
      <el-form-item label="Tiêu đề" prop="name">
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

        <el-form-item label="Thành viên" prop="members">
          <el-select
            v-model="form.members"
            multiple
            placeholder="Chọn thành viên"
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
import ChatService from "@/services/Chat.service";
import MemberService from "@/services/Member.service";

const props = defineProps({
  modelValue: Boolean,
  projectId: Number,
});

const emit = defineEmits(["update:modelValue", "channel-added"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const channelForm = ref();
const users = ref([]);

const form = reactive({
  name: "",
  description: "",
  members: [],
});

const rules = {
  name: [{ required: true, message: "Tiêu đề là bắt buộc", trigger: "blur" }],
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

function resetForm() {
  form.name = "";
  form.description = "";
  form.members = [];
}

function handleClose() {
  visible.value = false;
  resetForm();
}

onMounted(() => {
  fetchMembers();
});

async function submitForm() {
  if (!channelForm.value) return;

  try {
    await channelForm.value.validate();

    const user = JSON.parse(localStorage.getItem("user"));

    const payload = {
      project_id: props.projectId,
      name: form.name,
      description: form.description,
      created_by: user.id,
      members: form.members,
    };

    await ChatService.createChannel(payload);

    ElMessage.success("Tạo nhóm chat thành công");
    visible.value = false;
    emit("channel-added");
    resetForm();
  } catch (err) {
    console.error("Lỗi tạo nhóm:", err);
    ElMessage.error("Lỗi tạo nhóm");
  }
}
</script>