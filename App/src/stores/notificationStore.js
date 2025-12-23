import { defineStore } from "pinia";
import NotificationService from "@/services/Notification.service";
import { useProjectStore } from "@/stores/projectStore";
import { useTaskStore } from "@/stores/taskStore";
import { useFileStore } from "@/stores/fileStore";
import ChatService from "@/services/Chat.service";

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

        const data = await NotificationService.getAllNotifications({
          recipient_id: user.id,
        });

        const projectStore = useProjectStore();
        const taskStore = useTaskStore();

        this.notifications = await Promise.all(
          data.map(async (noti) => {
            let title = "Thông báo";

            if (noti.reference_type === "project") {
              title = await projectStore.getNameById(noti.reference_id);
            } else if (noti.reference_type === "task") {
              title = await taskStore.getNameById(noti.reference_id);
            }

            return { ...noti, title };
          })
        );

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
        return this.newCount;
      } catch (err) {
        console.error("Lỗi lấy số thông báo:", err);
      }
    },

    async addNotification(payload) {
      const projectStore = useProjectStore();
      const taskStore = useTaskStore();

      let title = "Thông báo";
      if (payload.reference_type === "project") {
        title = await projectStore.getNameById(payload.reference_id);
      } else if (payload.reference_type === "task") {
        title = await taskStore.getNameById(payload.reference_id);
      }

      this.notifications.unshift({ ...payload, title });
      await this.fetchNewCount();
    },

    async markAllAsUnread(recipient_id) {
      try {
        await NotificationService.markAllAsUnread(recipient_id);
      } catch (err) {
        console.error("Lỗi markAllAsUnread:", err);
      }
    },

    async getReferenceByNoti(noti) {
      try {
        if (!noti?.reference_type || !noti?.reference_id) return null;
        console.log("Lấy reference cho noti:", noti);

        if (noti.reference_type === "project") {
          const projectStore = useProjectStore();
          if (!projectStore.projects?.length)
            await projectStore.fetchProjects();
          return projectStore.projects.find(
            (p) => p.id === noti.reference_id
          );
        }

        if (noti.reference_type === "task") {
          const taskStore = useTaskStore();
          let task = taskStore.taskCache?.[noti.reference_id];
          if (!task) {
            task = await taskStore.loadTaskById(noti.reference_id);
          }
          return task;
        }

        if (noti.reference_type === "chat_message") {
          const channel = await ChatService.getMessageChannel(noti.reference_id);
          console.log("Lấy reference chat_message:", channel);
          if (!channel) return null;

          return {
            message_id: noti.reference_id,
            channel_id: channel.id,
            project_id: channel.project_id,
          };
        }

        return null;
      } catch (err) {
        console.error("Lỗi lấy reference:", err);
        return null;
      }
    },
  },
});