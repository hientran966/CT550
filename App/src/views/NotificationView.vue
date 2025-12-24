<template>
  <el-card class="notification-view" shadow="never">
    <template #header>
      <div class="header">
        <div>
          <h2>Thông báo</h2>
          <el-button-group>
            <el-button
              type="primary"
              :plain="filterType !== 'all'"
              @click="setFilter('all')"
            >
              Tất cả
            </el-button>

            <el-button
              type="primary"
              :plain="filterType !== 'unread'"
              @click="setFilter('unread')"
            >
              Chưa đọc
            </el-button>
          </el-button-group>
        </div>

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

    <!-- Loading -->
    <el-skeleton v-if="loading" :rows="4" animated />

    <!-- Empty -->
    <el-empty
      v-else-if="!filteredNotifications.length"
      description="Không có thông báo nào."
    />

    <!-- Danh sách thông báo -->
    <el-scrollbar v-else class="notification-list">
      <el-card
        v-for="noti in filteredNotifications"
        :key="noti.id"
        class="noti-card"
        :class="{ unread: noti.status !== 'read' }"
        shadow="hover"
        @click="openNotification(noti)"
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
import { onMounted, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useNotificationStore } from "@/stores/notificationStore";
import NotificationService from "@/services/Notification.service";

const notiStore = useNotificationStore();
const router = useRouter();

const filterType = ref("all");

const notifications = computed(() => notiStore.notifications);
const unreadNotifications = computed(() =>
  notiStore.notifications.filter((n) => n.status !== "read")
);
const filteredNotifications = computed(() => {
  return filterType.value === "unread"
    ? unreadNotifications.value
    : notifications.value;
});
const loading = computed(() => notiStore.loading);

const setFilter = (type) => {
  filterType.value = type;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN");
};

const markAllAsRead = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;

    await NotificationService.markAllAsRead(user.id);
    await notiStore.fetchNotifications();
    await notiStore.fetchNewCount();

    ElMessage.success("Đã đánh dấu tất cả thông báo là đã xem");
  } catch (err) {
    console.error("Lỗi khi đánh dấu tất cả:", err);
    ElMessage.error("Không thể đánh dấu tất cả đã xem");
  }
};

const openNotification = async (noti) => {
  try {
    if (noti.status !== "read") {
      await NotificationService.markAsRead(noti.id);
      noti.status = "read";
      await notiStore.fetchNewCount();
    }

    const ref = await notiStore.getReferenceByNoti(noti);
    console.log("Tham chiếu thông báo:", ref);

    if (noti.type === "project_invite") {
      router.push({path: `/`});
      return;
    }

    if (noti.reference_type === "task" && ref) {
      router.push({
        path: `/projects/${ref.project_id}`,
        query: { task: ref.id },
      });
      return;
    }

    if (noti.reference_type === "project" && ref) {
      router.push(`/projects/${ref.id}`);
      return;
    }

    if (noti.reference_type === "project") {
      router.push(`/projects`);
      return;
    }

    if (noti.reference_type === "chat_message" && ref) {
      router.push({
        path: `/projects/${ref.project_id}`,
        query: { channel: ref.channel_id, message: ref.message_id, }
      });
      return;
    }

    if (noti.reference_type === "file") {
      router.push({
        path: `/file/${noti.reference_id}`,
      });
      return;
    }

    router.push("/notifications");
  } catch (err) {
    console.error("Lỗi khi mở thông báo:", err);
    ElMessage.error("Không thể mở thông báo này");
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
  height: calc(100vh - 100px);
  overflow-y: auto;
  background-color: #ebebeb;
}

.notification-view :deep(.el-card__body) {
  padding: 0;
}

.noti-card :deep(.el-card__body) {
  padding: 20px !important;
  transition: background 0.2s, border-left 0.2s;
  cursor: pointer;
}

.noti-card:hover {
  background: #f2f2f2;
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