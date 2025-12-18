<template>
  <el-dialog
    v-model="visible"
    title="Thêm Dự Án Mới"
    width="600px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="projectForm"
      label-width="120px"
    >
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
          style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="Đến hạn" prop="end_date">
        <el-date-picker
          v-model="form.end_date"
          type="date"
          placeholder="Chọn ngày kết thúc"
          :disabled-date="
            (date) =>
                (form.start_date && date < new Date(form.start_date))
          "
          style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="Trạng thái" prop="status">
        <el-select
          v-model="form.status"
          placeholder="Chọn trạng thái"
          style="width: 100%;"
        >
          <el-option label="Lên kế hoạch" value="Lên kế hoạch" />
          <el-option label="Chưa bắt đầu" value="Chưa bắt đầu" />
          <el-option label="Đang tiến hành" value="Đang tiến hành" />
        </el-select>
      </el-form-item>

      <el-form-item label="Thành viên">
        <div class="flex gap-2 mb-3">
          <el-input
            v-model="newMember.email"
            placeholder="Nhập email thành viên"
            style="width: 60%;"
          />
          <el-select
            v-model="newMember.role"
            placeholder="Chọn vai trò"
            style="width: 30%;"
          >
            <el-option label="Manager" value="manager" />
            <el-option label="Member" value="member" />
            <el-option label="Viewer" value="viewer" />
          </el-select>
          <el-button type="primary" plain @click="addMember">
            Thêm
          </el-button>
        </div>

        <el-table
          :data="form.members"
          border
          style="width: 100%; margin-top: 10px"
        >
          <el-table-column prop="email" label="Email" />
          <el-table-column prop="role" label="Vai trò" />
          <el-table-column label="Hành động" width="80">
            <template #default="{ $index }">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="removeMember($index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="submitForm">Tạo</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";

import ProjectService from "@/services/Project.service";
import AccountService from "@/services/Account.service";
import MemberService from "@/services/Member.service";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "project-added"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const projectForm = ref();

const form = reactive({
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "Lên kế hoạch",
  members: [] as { user_id: number; email: string; role: string }[],
});

const newMember = reactive({
  email: "",
  role: "member",
});

const rules = {
  name: [{ required: true, message: "Tiêu đề là bắt buộc", trigger: "blur" }],
  start_date: [
    { required: true, message: "Ngày bắt đầu là bắt buộc", trigger: "change" },
  ],
  end_date: [
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
};

function handleClose() {
  visible.value = false;
  resetForm();
}

function resetForm() {
  Object.assign(form, {
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "Lên kế hoạch",
    members: [],
  });
  Object.assign(newMember, { email: "", role: "member" });
}

function removeMember(index: number) {
  form.members.splice(index, 1);
}

async function addMember() {
  if (!newMember.email) return ElMessage.warning("Vui lòng nhập email");

  try {
    const users = await AccountService.findByEmail(newMember.email);
    const user = Array.isArray(users) ? users[0] : users;
    const currentUser = await AccountService.getCurrentUser();
    if (user?.id === currentUser.id) {
      ElMessage.warning("Bạn không thể thêm chính mình");
      return;
    }

    if (!user) {
      ElMessage.error("Email không tồn tại trong hệ thống");
      return;
    }

    const exists = form.members.some((m) => m.user_id === user.id);
    if (exists) {
      ElMessage.warning("Thành viên này đã có trong danh sách");
      return;
    }

    form.members.push({
      user_id: user.id,
      email: user.email,
      role: newMember.role,
    });

    ElMessage.success(`Đã thêm ${user.email}`);
    newMember.email = "";
    newMember.role = "member";
  } catch (err) {
    console.error("Lỗi kiểm tra email:", err);
    ElMessage.error("Không thể kiểm tra email");
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toSQLDate(value: Date | string) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function submitForm() {
  if (!projectForm.value) return;
  try {
    await projectForm.value.validate();

    const user = JSON.parse(localStorage.getItem("user"));
    const payload = {
      name: form.name,
      description: form.description,
      start_date: toSQLDate(form.start_date),
      end_date: toSQLDate(form.end_date),
      status: form.status,
      created_by: user.id,
      members: form.members.map((m) => ({
        user_id: m.user_id,
        role: m.role,
      })),
    };

    await ProjectService.createProject(payload);

    ElMessage.success("Tạo dự án thành công");
    visible.value = false;
    emit("project-added");
    resetForm();
  } catch (err) {
    console.error("Lỗi tạo dự án:", err);
    ElMessage.error("Lỗi tạo dự án");
  }
}
</script>
