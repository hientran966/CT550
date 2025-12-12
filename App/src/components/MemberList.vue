<template>
  <el-dialog
    v-model="visible"
    title="Quản lý thành viên"
    width="600px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-form :model="form" ref="memberForm" label-width="120px">
      <!-- Form thêm thành viên -->
      <el-form-item label="Thành viên" v-if="canManage">
        <div class="members-input">
          <el-input
            v-model="newMember.email"
            placeholder="Nhập email thành viên"
            style="width: 60%"
          />
          <el-select
            v-model="newMember.role"
            placeholder="Chọn vai trò"
            style="width: 30%"
          >
            <el-option label="Manager" value="manager" />
            <el-option label="Member" value="member" />
            <el-option label="Viewer" value="viewer" />
          </el-select>
          <el-button type="primary" plain @click="addMember">Thêm</el-button>
        </div>
      </el-form-item>
    </el-form>

    <!-- Bảng danh sách -->
    <el-table
      v-loading="loading"
      :data="form.members"
      border
      style="width: 100%; margin-top: 10px"
    >
      <el-table-column prop="name" label="Tên" />
      <el-table-column prop="role" label="Vai trò" />
      <el-table-column label="Hành động" width="100">
        <template #default="{ row }">
          <el-popconfirm
            v-if="canManage"
            title="Bạn có chắc muốn xóa thành viên này không?"
            confirm-button-text="Xóa"
            cancel-button-text="Hủy"
            @confirm="deleteMember(row.id)"
          >
            <template #reference>
              <el-button type="danger" :icon="Delete" circle />
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog xác nhận -->
    <el-dialog
      v-model="confirmDialogVisible"
      width="400px"
      title="Xác nhận mời thành viên"
    >
      <div class="confirm-container">
        <el-avatar :size="70" :src="avatarUrl" />
        <div style="margin-top: 10px; text-align:center">
          <div><strong>{{ userFound?.name || "Không có tên" }}</strong></div>
          <div style="color: gray">{{ userFound?.email }}</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="confirmDialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="confirmInvite">Xác nhận</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { useRoleStore } from "@/stores/roleStore";

import MemberService from "@/services/Member.service";
import AccountService from "@/services/Account.service";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";

// Props
const props = defineProps({
  modelValue: Boolean,
  project_id: Number
});

// Emits
const emit = defineEmits(["update:modelValue", "member-updated"]);

// Visible binding
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Data
const loading = ref(false);
const confirmDialogVisible = ref(false);
const avatarUrl = ref(defaultAvatar);
const userFound = ref(null);

const form = reactive({
  members: []
});

const newMember = reactive({
  email: "",
  role: "member",
});

// ---------- ROLE STORE ----------
const roleStore = useRoleStore();
const projectRole = ref(null);

const canManage = computed(() =>
  ["owner", "manager"].includes(projectRole.value?.role)
);

// Load role
async function loadRole() {
  if (!props.project_id) return;
  projectRole.value = await roleStore.fetchProjectRole(props.project_id);
}

// ---------- WATCHERS ----------
watch(
  () => props.modelValue,
  async (val) => {
    if (val && props.project_id) {
      await loadRole();
      await loadMembers();
    }
  }
);

// Close dialog
function handleClose() {
  visible.value = false;
  resetForm();
}

function resetForm() {
  form.members = [];
  newMember.email = "";
  newMember.role = "member";
}

// Load list
async function loadMembers() {
  if (!props.project_id) return;
  loading.value = true;

  try {
    const data = await MemberService.getByProjectId(props.project_id);
    form.members = data || [];
  } catch (err) {
    console.error(err);
    ElMessage.error("Không thể tải danh sách thành viên");
  } finally {
    loading.value = false;
  }
}

// Step 1: search and preview user
async function addMember() {
  if (!canManage.value) return ElMessage.warning("Bạn không có quyền thêm thành viên");
  if (!newMember.email) return ElMessage.warning("Vui lòng nhập email");

  try {
    const users = await AccountService.findByEmail(newMember.email);
    const user = Array.isArray(users) ? users[0] : users;

    if (!user) {
      ElMessage.error("Email không tồn tại trong hệ thống");
      return;
    }

    const exists = await MemberService.checkIfMemberExists(props.project_id, user.id);
    if (exists) {
      ElMessage.warning("Người dùng này đã được mời hoặc đang là thành viên");
      return;
    }

    userFound.value = user;
    await loadAvatar(user.id); 

    confirmDialogVisible.value = true;
  } catch (err) {
    console.error(err);
    ElMessage.error("Lỗi khi tìm thành viên");
  }
}

// Step 2: confirm invite
async function confirmInvite() {
  try {
    const curr_user = await AccountService.getCurrentUser();

    await MemberService.createMember({
      project_id: props.project_id,
      user_id: userFound.value.id,
      role: newMember.role,
      invited_by: curr_user.id,
    });

    ElMessage.success(`Đã gửi lời mời đến ${userFound.value.email}`);

    confirmDialogVisible.value = false;
    userFound.value = null;

    await loadMembers();
    emit("member-updated");

    newMember.email = "";
    newMember.role = "member";

  } catch (err) {
    console.error(err);
    ElMessage.error("Không thể gửi lời mời");
  }
}

// Delete member
async function deleteMember(memberId) {
  if (!canManage.value) return ElMessage.warning("Bạn không có quyền xóa thành viên");

  try {
    await MemberService.deleteMember(memberId);
    ElMessage.success("Đã xóa thành viên");
    await loadMembers();
    emit("member-updated");
  } catch (err) {
    console.error(err);
    ElMessage.error("Không thể xóa thành viên");
  }
}

async function loadAvatar(userId) {
  try {
    const res = await FileService.getAvatar(userId);
    avatarUrl.value = res?.file_url || defaultAvatar;
  } catch {
    avatarUrl.value = defaultAvatar;
  }
}

onMounted(async () => {
  if (props.project_id) await loadRole();
});
</script>

<style scoped>
.members-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}
.confirm-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
}
</style>