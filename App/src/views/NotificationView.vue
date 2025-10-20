<template>
  <el-card class="notification-view" shadow="never">
    <template #header>
      <div class="header">
        <h2>Thông báo</h2>
        <el-button
          type="primary"
          size="small"
          :disabled="!unreadNotifications.length"
          @click="markAllAsRead"
        >
          Đánh dấu tất cả đã xem
        </el-button>
      </div>
    </template>

    <el-skeleton v-if="loading" :rows="4" animated />

    <el-empty
      v-else-if="!notifications.length"
      description="Không có thông báo nào."
    />

    <el-scrollbar v-else class="notification-list">
      <el-card
        v-for="noti in notifications"
        :key="noti.id"
        class="noti-card"
        :class="{ unread: !noti.status === 'read' }"
        shadow="hover"
      >
        <div class="noti-content">
          <div class="noti-header">
            <strong>{{ noti.title || "Thông báo" }}</strong>
            <small>{{ formatDate(noti.created_at) }}</small>
          </div>
          <p>{{ noti.message }}</p>
        </div>
      </el-card>
    </el-scrollbar>
  </el-card>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useNotificationStore } from "@/stores/notificationStore";
import NotificationService from "@/services/Notification.service";
import { ElMessage } from "element-plus";

const notiStore = useNotificationStore();

const notifications = computed(() => notiStore.notifications);
const unreadNotifications = computed(() =>
  notiStore.notifications.filter((n) => !n.status === "read")
);
const loading = computed(() => notiStore.loading);

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN");
};

const markAllAsRead = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;
    console.log(notifications.value);

    await NotificationService.markAllAsRead(user.id);

    await notiStore.fetchNotifications();

    ElMessage.success("Đã đánh dấu tất cả thông báo là đã xem");
  } catch (err) {
    console.error("Lỗi khi đánh dấu tất cả:", err);
    ElMessage.error("Không thể đánh dấu tất cả đã xem");
  }
};

onMounted(() => {
  notiStore.fetchNotifications();
});
</script>

<style scoped>
.notification-view {
  min-width: 700px;
  width: 70vw;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  height: 50px;
}

.notification-list {
  height: calc(100vh - 50px);
  overflow-y: auto;
  background-color: #ebebeb;
}

.notification-view :deep(.el-card__body) {
  padding: 0;
}

.noti-card :deep(.el-card__body) {
  padding: 20px !important;
  transition: background 0.2s;
}

.noti-card.unread {
  border-left: 4px solid var(--el-color-primary);
  background: #f5faff;
}

.noti-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.noti-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.noti-header small {
  color: #999;
  font-size: 12px;
}
</style>
