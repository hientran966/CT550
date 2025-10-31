<template>
  <div class="auth">
    <div class="page">
      <div class="header">
        <h4>{{ activeTab === 'login' ? 'Đăng Nhập' : 'Đăng Ký' }}</h4>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="0px" class="form">
        <el-form-item v-if="activeTab === 'register'" prop="name">
          <el-input v-model="form.name" placeholder="Tên người dùng" :prefix-icon="User"></el-input>
        </el-form-item>

        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="Email" :prefix-icon="Message"></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="Mật khẩu" show-password :prefix-icon="Lock"></el-input>
        </el-form-item>

        <el-form-item v-if="activeTab === 'register'" prop="passwordConfirm">
          <el-input v-model="form.passwordConfirm" placeholder="Nhập lại mật khẩu" show-password :prefix-icon="Lock"></el-input>
        </el-form-item>

        <p class="error-msg">{{ message }}</p>

        <div class="actions">
          <el-button type="primary" class="main-btn" @click="submit" :loading="loading">
            {{ activeTab === 'login' ? 'Đăng Nhập' : 'Đăng Ký' }}
          </el-button>
          <el-button type="text" class="switch-btn" @click="toggleTab">
            {{ activeTab === 'login' ? 'Tạo tài khoản' : 'Đã có tài khoản' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import AuthService from "@/services/Account.service";
import { initSocket } from "@/plugins/socket";
import { Lock, Message, User } from "@element-plus/icons-vue";

const router = useRouter();
const activeTab = ref("login");
const loading = ref(false);
const message = ref("");

const formRef = ref(null);

const form = reactive({
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
});

const emailRule = (rule, value, callback) => {
  const re = /^\S+@\S+\.\S+$/;
  if (!value) callback(new Error("Vui lòng nhập email"));
  else if (!re.test(value)) callback(new Error("Email không hợp lệ"));
  else callback();
};

/*const rules = reactive({
  name: [{ required: activeTab.value === "register", message: "Vui lòng nhập họ tên", trigger: "blur" }],
  email: [{ validator: emailRule, trigger: "blur" }],
  password: [{ required: true, min: 6, message: "Mật khẩu ít nhất 6 ký tự", trigger: "blur" }],
  passwordConfirm: [
    { required: activeTab.value === "register", message: "Vui lòng xác nhận mật khẩu", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (activeTab.value === "register" && value !== form.password) callback(new Error("Mật khẩu không khớp"));
        else callback();
      },
      trigger: "blur",
    },
  ],
});*/

function toggleTab() {
  activeTab.value = activeTab.value === "login" ? "register" : "login";
  message.value = "";
}

async function submit() {
  loading.value = true;
  formRef.value.validate(async (valid) => {
    if (!valid) { loading.value = false; return; }
    try {
      if (activeTab.value === "login") {
        const res = await AuthService.login(form.email, form.password);
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        initSocket(res.user.id);
        ElMessage.success("Đăng nhập thành công");
        window.dispatchEvent(new Event("auth-changed"));
        router.push("/");
      } else {
        await AuthService.createAccount({name: form.name, email: form.email, password: form.password});
        ElMessage.success("Đăng ký thành công — hãy đăng nhập");
        toggleTab();
        form.name = form.email = form.password = form.passwordConfirm = "";
      }
    } catch (err) {
      message.value = activeTab.value === "login"
        ? "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
        : "Đăng ký thất bại. Vui lòng thử lại.";
      console.log(err)
    } finally { loading.value = false; }
  });
}
</script>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url("@/assets/background.jpg");
  background-size: cover;
  padding: 0;
}

.page {
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
  width: 360px;
  max-width: 100%;
  min-height: 240px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header h4 {
  margin-bottom: 20;
  font-size: 24px;
  font-weight: 600;
}

.header .sub {
  color: #6b6b6b;
  font-size: 14px;
  margin-bottom: 24px;
}

.form .el-input__inner {
  border-radius: 8px;
  padding-left: 12px;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.main-btn {
  flex: 1;
  border-radius: 8px;
}

.switch-btn {
  color: #409eff;
  font-weight: 500;
}

.error-msg {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 8px;
  text-align: left;
}
</style>