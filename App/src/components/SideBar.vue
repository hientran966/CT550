<template>
  <div class="sidebar-container">
    <el-menu
      class="el-menu-vertical"
      router
      :default-active="$route.path"
      :collapse="true"
      background-color="#545c64"
      @select="handleMenuSelect"
    >
      <!-- Home -->
      <el-menu-item index="/">
        <el-icon><House color="white" /></el-icon>
        <template #title>Home</template>
      </el-menu-item>

      <!-- Project -->
      <el-menu-item index="/projects">
        <el-icon><Files color="white" /></el-icon>
        <template #title>Dự án</template>
      </el-menu-item>

      <!-- Thông báo -->
      <el-menu-item index="/notifications">
        <el-icon>
          <el-badge
            :value="unreadCount"
            :hidden="!unreadCount"
            class="badge"
            type="danger"
          >
            <Bell color="white" />
          </el-badge>
        </el-icon>
        <template #title>Thông báo</template>
      </el-menu-item>
    </el-menu>

    <div class="logout-section">
      <el-menu :collapse="true" background-color="#545c64" class="logout-menu">
        <el-menu-item index="/" @click="onLogout">
          <el-icon><SwitchButton color="white" /></el-icon>
          <template #title>Đăng xuất</template>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<script setup>
import { Bell, Files, House, SwitchButton } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notificationStore";
import { disconnectSocket } from "@/plugins/socket";

defineProps({
  unreadCount: {
    type: Number,
    default: 0,
  },
});

const router = useRouter();
const notiStore = useNotificationStore();

const handleMenuSelect = async (index) => {
  if (index === "/notifications") {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.id) {
        await notiStore.markAllAsUnread(user.id);
        await notiStore.fetchNewCount();
      }
    } catch (err) {
      console.error("Lỗi khi markAsUnread:", err);
    }
  }

  router.push(index);
};

const onLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  disconnectSocket();
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

.badge {
  position: relative;
  top: 2px;
}
</style>