<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Chỉnh sửa nhóm chat' : 'Thêm nhóm chat mới'"
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
      <el-button type="primary" @click="submitForm">
        {{ isEdit ? "Lưu" : "Tạo" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";

import { useChatStore } from "@/stores/chatStore";

import MemberService from "@/services/Member.service";

const props = defineProps({
  modelValue: Boolean,
  projectId: Number,
  channelId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "channel-added", "channel-updated"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
const isEdit = computed(() => !!props.channelId);

const chatStore = useChatStore();

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

async function loadChannelDetail() {
  if (!props.channelId) return;

  try {
    const channel = await chatStore.getChannelDetail(props.channelId);

    form.name = channel.name;
    form.description = channel.description;
    form.members = channel.members.map((m) => m.user_id);
  } catch {
    ElMessage.error("Không thể tải thông tin kênh");
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
      members: form.members,
    };

    if (isEdit.value) {
      await chatStore.updateChannel(props.channelId, payload);
      ElMessage.success("Cập nhật kênh thành công");
      emit("channel-updated");
    } else {
      await chatStore.createChannel({
        ...payload,
        created_by: user.id,
      });
      ElMessage.success("Tạo nhóm chat thành công");
      emit("channel-added");
    }

    visible.value = false;
    resetForm();
  } catch (err) {
    console.error(err);
    ElMessage.error(isEdit.value ? "Cập nhật thất bại" : "Tạo nhóm thất bại");
  }
}

watch(
  () => props.modelValue,
  async (val) => {
    if (!val) return;

    await fetchMembers();

    if (isEdit.value) {
      await loadChannelDetail();
    }
  }
);
</script>