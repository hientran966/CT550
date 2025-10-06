<template>
  <div class="sidebar-container">
    <el-menu
      class="el-menu-vertical"
      router
      :default-active="$route.path"
      :collapse="true"
      background-color="#545c64"
    >
      <!-- Home -->
      <el-menu-item index="/">
        <el-icon><Location color="white" /></el-icon>
        <template #title>Home</template>
      </el-menu-item>

      <!-- Project -->
      <el-menu-item index="/projects">
        <el-icon><Files color="white" /></el-icon>
        <template #title>Dự án</template>
      </el-menu-item>

      <!-- About -->
      <el-menu-item index="/about">
        <el-icon><Document color="white" /></el-icon>
        <template #title>About</template>
      </el-menu-item>
    </el-menu>

    <div class="logout-section">
      <el-menu
        :collapse="true"
        background-color="#545c64"
        class="logout-menu"
      >
        <el-menu-item index="/" @click="onLogout">
          <el-icon><SwitchButton color="white" /></el-icon>
          <template #title>Đăng xuất</template>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Document, Files, Location, SwitchButton } from "@element-plus/icons-vue";

const onLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth-changed"));
};
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #545c64;
}

.el-menu-vertical {
  flex: 1;
  border-right: none;
}

.logout-section {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-menu {
  border-right: none;
}
</style>
