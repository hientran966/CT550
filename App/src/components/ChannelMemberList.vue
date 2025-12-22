<template>
  <el-dialog
    v-model="visible"
    :title="'Danh sách thành viên'"
    width="600px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-transfer
      v-model="targetKeys"
      :data="dataSource"
      filterable
      :titles="['Thành viên dự án', 'Thành viên kênh']"
      :props="{ key: 'key', label: 'label' }"
    />

    <template #footer>
      <el-button @click="visible = false">Hủy</el-button>
      <el-button type="primary" @click="submit">Lưu</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";

import { useChatStore } from "@/stores/chatStore";

import MemberService from "@/services/Member.service";
import ChatService from "@/services/Chat.service";

const props = defineProps({
  modelValue: Boolean,
  projectId: Number,
  channelId: Number,
});

const emit = defineEmits(["update:modelValue", "member-updated"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const projectMembers = ref([]);
const channelMembers = ref([]);

const targetKeys = ref([]);
const dataSource = ref([]);

const chatStore = useChatStore();

const channelForm = ref();
const users = ref([]);

const form = reactive({
  members: [],
});

async function loadData() {
  const projectRes = await MemberService.getByProjectId(props.projectId);
  projectMembers.value = projectRes || [];

  const channelRes = await ChatService.getChannelMembers(props.channelId);
  channelMembers.value = channelRes || [];

  const channelIds = new Set(channelMembers.value.map(m => m.user_id));

  dataSource.value = projectMembers.value.map(m => ({
    key: m.user_id,
    label: m.name,
  }));

  targetKeys.value = [...channelIds];
}


function resetForm() {
  form.members = [];
}

function handleClose() {
  visible.value = false;
  resetForm();
}

onMounted(() => {
  loadData();
});

async function submit() {
  try {
    const oldIds = new Set(channelMembers.value.map(m => m.user_id));
    const newIds = new Set(targetKeys.value);

    const toAdd = [...newIds].filter(id => !oldIds.has(id));
    const toRemove = [...oldIds].filter(id => !newIds.has(id));

    // add member
    await Promise.all(
      toAdd.map(id =>
        ChatService.addChannelMember(props.channelId, id)
      )
    );

    // remove member
    await Promise.all(
      toRemove.map(id =>
        ChatService.removeChannelMember(props.channelId, id)
      )
    );

    emit("member-updated");
    visible.value = false;
    ElMessage.success("Cập nhật thành viên thành công");
  } catch (err) {
    console.error(err);
    ElMessage.error("Cập nhật thất bại");
  }
}

watch(
  () => visible.value,
  (val) => {
    if (val && props.channelId) {
      loadData();
    }
  }
);
</script>