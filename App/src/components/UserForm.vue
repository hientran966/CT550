<template>
  <el-dialog
    :title="'Chỉnh sửa thông tin'"
    v-model="visible"
    width="450px"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="form-container">
      <div
        class="avatar-wrapper"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false"
      >
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :http-request="uploadAvatar"
        >
          <ElAvatar
            :src="avatar || defaultAvatar"
            :size="80"
            class="me-avatar"
          />
          <div v-if="hovering" class="upload-overlay">
            <el-icon><UploadFilled /></el-icon>
            <span>Upload</span>
          </div>
        </el-upload>
      </div>

      <!-- Form thông tin -->
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="Tên người dùng" prop="name">
          <el-input v-model="form.name" placeholder="Tên người dùng" />
        </el-form-item>

        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="Email" disabled/>
        </el-form-item>

        <p style="color: red; text-align: center">{{ message }}</p>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="warning" plain @click="openPasswordModal">
          Đổi mật khẩu
        </el-button>
        <el-button type="primary" :loading="loading" @click="submit">
          Lưu
        </el-button>
      </div>
    </template>

    <!-- Modal đổi mật khẩu -->
    <el-dialog
      title="Đổi mật khẩu"
      v-model="passwordModalVisible"
      width="400px"
      append-to-body
    >
      <el-form :model="passwordForm" ref="passwordFormRef" label-width="120px">
        <el-form-item label="Mật khẩu hiện tại" prop="oldPassword">
          <el-input
            type="password"
            v-model="passwordForm.oldPassword"
            show-password
          />
        </el-form-item>

        <el-form-item label="Mật khẩu mới" prop="newPassword">
          <el-input type="password" v-model="passwordForm.newPassword" show-password />
        </el-form-item>

        <el-form-item label="Xác nhận mật khẩu" prop="confirmPassword">
          <el-input
            type="password"
            v-model="passwordForm.confirmPassword"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordModalVisible = false">Hủy</el-button>
          <el-button type="primary" :loading="passwordLoading" @click="submitPassword">
            Lưu
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import AuthService from "@/services/Account.service";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";

const props = defineProps({
  modelValue: Boolean,
  user: Object,
});

const emit = defineEmits(["update:modelValue", "saved"]);

const formRef = ref(null);
const loading = ref(false);
const message = ref("");
const avatar = ref("");
const hovering = ref(false);
const passwordModalVisible = ref(false);
const passwordLoading = ref(false);

const form = reactive({
  id: null,
  name: "",
  email: "",
  role: "user",
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

watch(
  () => props.user,
  (val) => {
    if (val) {
      form.id = val.id;
      form.name = val.name || "";
      form.email = val.email || "";
      form.role = val.role || "user";
      loadAvatar(val.id);
    }
  },
  { immediate: true }
);

async function loadAvatar(userId) {
  try {
    const res = await FileService.getAvatar(userId);
    avatar.value = res?.file_url || defaultAvatar;
  } catch {
    avatar.value = defaultAvatar;
  }
}

const rules = reactive({
  name: [{ required: true, message: "Vui lòng nhập họ tên", trigger: "blur" }],
  email: [
    { required: true, message: "Vui lòng nhập email", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        const re = /^\S+@\S+\.\S+$/;
        if (!value) callback(new Error("Vui lòng nhập email"));
        else if (!re.test(value)) callback(new Error("Email không hợp lệ"));
        else callback();
      },
      trigger: "blur",
    },
  ],
});

function handleClose() {
  visible.value = false;
}

function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error("Chỉ được chọn file ảnh!");
    return false;
  }
  return true;
}

async function uploadAvatar({ file }) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await FileService.uploadAvatar(form.id, formData);
    if (res?.result?.file_url) {
      avatar.value = `${res.result.file_url}?v=${Date.now()}`;
      ElMessage.success("Cập nhật ảnh đại diện thành công!");
      emit("saved", { ...form });
    }
  } catch (err) {
    console.error("Upload avatar lỗi:", err);
    ElMessage.error("Tải ảnh lên thất bại!");
  }
}

async function submit() {
  loading.value = true;
  formRef.value.validate(async (valid) => {
    if (!valid) {
      loading.value = false;
      return;
    }

    try {
      await AuthService.updateAccount(form.id, {
        name: form.name,
        email: form.email,
        role: form.role,
      });
      ElMessage.success("Cập nhật thành công");
      emit("saved", { ...form });
      handleClose();
    } catch (err) {
      console.error(err);
      message.value = "Cập nhật thất bại. Vui lòng thử lại.";
    } finally {
      loading.value = false;
    }
  });
}

/* ----- ĐỔI MẬT KHẨU ----- */
function openPasswordModal() {
  passwordForm.oldPassword = "";
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
  passwordModalVisible.value = true;
}

async function submitPassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    return ElMessage.warning("Vui lòng nhập đầy đủ thông tin!");
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return ElMessage.error("Mật khẩu xác nhận không khớp!");
  }

  passwordLoading.value = true;
  try {
    await AuthService.changePassword(
      props.user.id,
      passwordForm.oldPassword,
      passwordForm.newPassword
    );

    ElMessage.success("Đổi mật khẩu thành công!");
    passwordModalVisible.value = false;
  } catch (err) {
    console.error(err);
    ElMessage.error("Đổi mật khẩu thất bại!");
  } finally {
    passwordLoading.value = false;
  }
}
</script>

<style scoped>
.form-container {
  text-align: center;
  margin-bottom: 16px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  transition: opacity 0.2s;
  pointer-events: none;
}

.me-avatar {
  border: 2px solid white;
  transition: transform 0.2s;
}

.avatar-wrapper:hover .me-avatar {
  transform: scale(1.05);
}

.dialog-footer {
  text-align: right;
}
</style>