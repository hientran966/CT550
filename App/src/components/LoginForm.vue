<template>
  <div>
    <el-form
      ref="loginFormRef"
      :model="loginInfo"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="Email" prop="email">
        <el-input v-model="loginInfo.email" autocomplete="off" />
      </el-form-item>

      <el-form-item label="Mật khẩu" prop="password">
        <el-input
          v-model="loginInfo.password"
          type="password"
          autocomplete="off"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" native-type="submit">Đăng nhập</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  loginInfo: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["submit:login"]);

const loginFormRef = ref(null);

const rules = {
  email: [
    { required: true, message: "Email là bắt buộc", trigger: "blur" },
    //{ type: "email", message: "Email không hợp lệ", trigger: ["blur", "change"] },
  ],
  password: [
    { required: true, message: "Mật khẩu là bắt buộc", trigger: "blur" },
    //{ min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự", trigger: "blur" },
  ],
};

const handleSubmit = () => {
  loginFormRef.value.validate((valid) => {
    if (valid) {
      emit("submit:login", props.loginInfo);
    }
  });
};
</script>