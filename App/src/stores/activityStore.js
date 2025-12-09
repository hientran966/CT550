import { defineStore } from "pinia";
import ActivityService from "@/services/Activity.service";
import { dayjs } from "element-plus";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    activitysByTask: {},
  }),

  actions: {
    async loadActivity(taskId) {
      try {
        const res = await ActivityService.getAllActivity({ task_id: taskId });
        this.ActivitysByTask[taskId] = (res || []).map((c) => ({
          ...c,
          created_at: dayjs(c.created_at).format("DD/MM/YYYY HH:mm"),
        }));
      } catch (err) {
        console.error("Lỗi load log:", err);
      }
    },

    async addActivity(taskId, payload) {
      const res = await ActivityService.createActivity(payload);
      const newAct = {
        ...res,
        created_at: dayjs(res.created_at).format("DD/MM/YYYY HH:mm"),
      };
      if (!this.ActivitysByTask[taskId]) this.ActivitysByTask[taskId] = [];
      this.ActivitysByTask[taskId].unshift(newAct);
    },
  },

  getters: {
    getActivitysByTask: (state) => (taskId) => state.activitysByTask[taskId] || [],
  },
});
