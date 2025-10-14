<template>
  <div class="common-layout">
    <LoginPage v-if="!isAuthenticated" />

    <el-container v-else>
      <el-aside class="sidebar" width="64px">
        <SideBar :unread-count="unreadCount" />
      </el-aside>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { ElNotification } from "element-plus";
import SideBar from "./components/SideBar.vue";
import LoginPage from "@/views/LoginPage.vue";
import { initSocket, disconnectSocket } from "@/plugins/socket";
import NotificationService from "@/services/Notification.service";

const isAuthenticated = ref(false);
const unreadCount = ref(0);
let socket = null;

const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem("token");
};

const loadUnreadCount = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      const count = await NotificationService.getUnreadCount(user.id);
      unreadCount.value = count || 0;
    }
  } catch (err) {
    console.error("Lỗi khi lấy số thông báo:", err);
  }
};

watch(isAuthenticated, async (loggedIn) => {
  if (loggedIn) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      await loadUnreadCount();

      socket = initSocket(user.id);
      socket.on("notification", async ({ type, payload }) => {
        console.log("Nhận thông báo:", payload);
        ElNotification({
          title: payload.title || "Thông báo mới",
          message: payload.message || "Bạn có thông báo mới",
          type: type || "info",
          duration: 4000,
        });

        await loadUnreadCount();
      });
    }
  } else {
    disconnectSocket();
    unreadCount.value = 0;
  }
});

onMounted(() => {
  checkAuth();
  window.addEventListener("auth-changed", checkAuth);
});

onBeforeUnmount(() => {
  window.removeEventListener("auth-changed", checkAuth);
  disconnectSocket();
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