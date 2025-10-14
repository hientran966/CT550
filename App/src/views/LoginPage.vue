<template>
  <div class="login">
    <div class="page">
      <h4>Đăng Nhập</h4>

      <LoginForm
        :loginInfo="loginInfo"
        @submit:login="login"
      />

      <p style="color: red;">{{ message }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LoginForm from "@/components/LoginForm.vue";
import AuthService from "@/services/Account.service";
import { ElMessage } from "element-plus";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { initSocket } from "@/plugins/socket";

const router = useRouter();

const loginInfo = reactive({
  email: "",
  password: "",
});

const message = ref("");

const login = async (info: { email: string; password: string }) => {
  try {
    const response = await AuthService.login(info.email, info.password);
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    initSocket(response.user.id);

    ElMessage.success("Đăng nhập thành công");
    window.dispatchEvent(new Event("auth-changed"));

    router.push("/");
  } catch (error) {
    message.value = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
  }
};
</script>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}
.page {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 300px;
}
h4 {
  text-align: center;
  margin-bottom: 24px;
}
</style>