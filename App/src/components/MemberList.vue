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
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { useRoleStore } from "@/stores/roleStore";

import MemberService from "@/services/Member.service";
import AccountService from "@/services/Account.service";

const props = defineProps<{ modelValue: boolean; project_id: number }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "member-updated"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const loading = ref(false);
const memberForm = ref();

const form = reactive({
  members: [] as { id: number; user_id: number; name: string; role: string }[],
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

// ---------- METHODS ----------
function handleClose() {
  visible.value = false;
  resetForm();
}

function resetForm() {
  form.members = [];
  Object.assign(newMember, { email: "", role: "member" });
}

async function loadMembers() {
  if (!props.project_id) return;
  loading.value = true;
  try {
    const data = await MemberService.getByProjectId(props.project_id);
    form.members = data || [];
  } catch (err) {
    console.error("Lỗi khi lấy danh sách thành viên:", err);
    ElMessage.error("Không thể tải danh sách thành viên");
  } finally {
    loading.value = false;
  }
}

async function addMember() {
  if (!canManage.value) return ElMessage.warning("Bạn không có quyền thêm thành viên");

  const curr_user = await AccountService.getCurrentUser();
  if (!newMember.email) return ElMessage.warning("Vui lòng nhập email");

  try {
    const users = await AccountService.findByEmail(newMember.email);
    const user = Array.isArray(users) ? users[0] : users;
    if (!user) {
      ElMessage.error("Email không tồn tại trong hệ thống");
      return;
    }

    const existing = await MemberService.checkIfMemberExists(props.project_id, user.id);
    if (existing) {
      ElMessage.warning("Người dùng này đã được mời hoặc đang là thành viên");
      return;
    }

    await MemberService.createMember({
      project_id: props.project_id,
      user_id: user.id,
      role: newMember.role,
      invited_by: curr_user.id,
    });

    ElMessage.success(`Đã gửi lời mời đến ${user.email}`);
    await loadMembers();
    emit("member-updated");

    newMember.email = "";
    newMember.role = "member";
  } catch (err) {
    console.error("Lỗi thêm thành viên:", err);
    ElMessage.error("Không thể thêm thành viên");
  }
}

async function deleteMember(memberId: number) {
  if (!canManage.value) return ElMessage.warning("Bạn không có quyền xóa thành viên");

  try {
    await MemberService.deleteMember(memberId);
    ElMessage.success("Đã xóa thành viên");
    await loadMembers();
    emit("member-updated");
  } catch (err) {
    console.error("Lỗi xóa thành viên:", err);
    ElMessage.error("Không thể xóa thành viên");
  }
}

// ---------- INIT ----------
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
</style>