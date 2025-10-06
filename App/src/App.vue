<template>
  <div class="common-layout">
    <LoginPage v-if="!isAuthenticated" />

    <el-container v-else>
      <el-aside class="sidebar" width="64px">
        <SideBar />
      </el-aside>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import SideBar from "./components/SideBar.vue";
import LoginPage from "@/views/LoginPage.vue";

const isAuthenticated = ref(false);

const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem("token");
};

onMounted(() => {
  checkAuth();
  window.addEventListener("auth-changed", checkAuth);
});

onBeforeUnmount(() => {
  window.removeEventListener("auth-changed", checkAuth);
});
</script>

<style>
.main-content {
  background-color: #ffe3e3;
  min-height: 100vh;
}

.el-main {
  padding: 0 !important;
  height: 100%;
}

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>