import { defineStore } from "pinia";
import NotificationService from "@/services/Notification.service";

export const useNotificationStore = defineStore("noti", {
  state: () => ({
    notifications: [],
    newCount: 0,
    loading: false,
  }),

  actions: {
    async fetchNotifications() {
      try {
        this.loading = true;
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;
        this.notifications = await NotificationService.getAllNotifications({
          recipient_id: user.id,
        });
        await this.fetchNewCount();
      } catch (err) {
        console.error("Lỗi load Notification:", err);
      } finally {
        this.loading = false;
      }
    },

    async fetchNewCount() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;
        this.newCount = await NotificationService.getNewCount(user.id);
        console.log("New notification count:", this.newCount);
        
        return this.newCount;
      } catch (err) {
        console.error("Lỗi lấy số thông báo:", err);
      }
    },

    async addNotification(payload) {
      this.notifications.unshift(payload);
      await this.fetchNewCount();
    },
  },
});