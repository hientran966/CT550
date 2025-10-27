<template>
  <div class="common-layout">
    <LoginPage v-if="!isAuthenticated" />

    <el-container v-else>
      <el-aside class="sidebar" width="64px">
        <SideBar :unread-count="newCount" />
      </el-aside>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { ElNotification } from "element-plus";
import { initSocket, disconnectSocket } from "@/plugins/socket";

import SideBar from "./components/SideBar.vue";
import LoginPage from "@/views/LoginPage.vue";


import { useNotificationStore } from "@/stores/notificationStore";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";

const notiStore = useNotificationStore();
const taskStore = useTaskStore();
const projectStore = useProjectStore();

const isAuthenticated = ref(false);
const newCount = computed(() => notiStore.newCount);
let socket = null;

const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem("token");
};

watch(isAuthenticated, async (loggedIn) => {
  if (loggedIn) {
    await notiStore.fetchNotifications();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {

      socket = initSocket(user.id);
      socket.on("notification", async (data) => {
        console.log("Nhận thông báo:", data);

        ElNotification({
          title: data.title || "Thông báo mới",
          message: data.message || "Bạn có thông báo mới",
          type: data.type || "info",
          duration: 4000,
        });

        await notiStore.addNotification(data);

        if (data.type === "task_assigned" || data.type === "task_updated") {
          taskStore.loadTasks(data.project_id);
        }
        if (data.type === "project_updated") {
          projectStore.fetchProjects();
        }
      });

      socket.on("task_updated", (data) => {
        const projectId = data.project_id || data.task?.project_id;
        if (projectId) {
          taskStore.loadTasks(projectId);
        }
      });

    }
  } else {
    disconnectSocket();
    notiStore.$reset();
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
  background-image: url("@/assets/background.jpg");
  background-size: cover;
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