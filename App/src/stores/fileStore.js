import { defineStore } from "pinia";
import FileService from "@/services/File.service";

export const useFileStore = defineStore("file", {
  state: () => ({
    filesByTask: {},
  }),

  actions: {
    async loadFiles(taskId) {
      try {
        const res = await FileService.getAllFiles({ task_id: taskId });
        this.filesByTask[taskId] = res || [];
      } catch (err) {
        console.error("Lỗi load file:", err);
      }
    },

    addFile(taskId, file) {
      if (!this.filesByTask[taskId]) this.filesByTask[taskId] = [];
      this.filesByTask[taskId].push(file);
    },
  },

  getters: {
    getFilesByTask: (state) => (taskId) => state.filesByTask[taskId] || [],
  },
});
