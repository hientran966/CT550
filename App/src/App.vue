<template>
  <router-view v-if="isEmptyLayout" />

  <LoginPage v-else-if="!isAuthenticated" />

  <el-container v-else class="common-layout">
    <el-aside class="sidebar" width="64px">
      <SideBar :unread-count="newCount" />
    </el-aside>

    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElNotification } from "element-plus";
import { initSocket, disconnectSocket } from "@/plugins/socket";

import SideBar from "@/components/SideBar.vue";
import LoginPage from "@/views/LoginPage.vue";

import { useNotificationStore } from "@/stores/notificationStore";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useInviteStore } from "@/stores/inviteStore";
import { useRoleStore } from "./stores/roleStore";

/* =======================
   Router & Layout
======================= */
const route = useRoute();
const router = useRouter();
const isEmptyLayout = computed(() => route.meta?.layout === "empty");

/* =======================
   Stores
======================= */
const notiStore = useNotificationStore();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const inviteStore = useInviteStore();
const roleStore = useRoleStore();

/* =======================
   Auth state
======================= */
const isAuthenticated = ref(false);
const newCount = computed(() => notiStore.newCount);
let socket = null;

const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem("token");
};

/* =======================
   Watch auth
======================= */
watch(isAuthenticated, async (loggedIn) => {
  if (loggedIn) {
    await notiStore.fetchNotifications();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return;

    socket = initSocket(user.id);

    socket.on("notification", async (data) => {
      ElNotification({
        title: data.title || "Thông báo mới",
        message: data.message || "Bạn có thông báo mới",
        type: data.type || "info",
        duration: 4000,
        onClick: () => {
            router.push("/notifications");
        },
      });

      await notiStore.addNotification(data);

      switch (data.type) {
        case "task_assigned":
        case "task_updated":
          taskStore.loadTasks(data.project_id);
          break;

        case "project_updated":
          projectStore.fetchProjects();
          break;

        case "project_invite":
          await inviteStore.fetchInvites();
          break;
      }
    });

    socket.on("task_updated", (data) => {
      const projectId = data.project_id || data.task?.project_id;
      if (projectId) {
        taskStore.loadTasks(projectId);
      }
    });
  } else {
    disconnectSocket();
    notiStore.$reset();
  }
});

/* =======================
   Lifecycle
======================= */
onMounted(() => {
  checkAuth();
  window.addEventListener("auth-changed", checkAuth);
  window.addEventListener("forbidden", () => {
    router.replace({ name: "not-found" });
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("auth-changed", checkAuth);
  disconnectSocket();
});
</script>

<style>
.common-layout {
  min-height: 100vh;
}

.sidebar {
  background: #1f2937;
}

.main-content {
  background-image: url("@/assets/background.jpg");
  background-size: cover;
  min-height: 100vh;
  width: calc(100vw - 64px);
}

.el-main {
  padding: 0 !important;
  height: 100%;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>