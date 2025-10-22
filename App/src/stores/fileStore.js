import { defineStore } from "pinia";
import FileService from "@/services/File.service";

export const useFileStore = defineStore("file", {
  state: () => ({
    filesByTask: {},
    filesByProject: {},
    filesByUserInProject: {},
  }),

  actions: {
    async loadFiles(taskId) {
      try {
        const res = await FileService.getAllFiles({ task_id: taskId });
        this.filesByTask[taskId] = res || [];
      } catch (err) {
        console.error("Lỗi load file theo task:", err);
      }
    },

    async loadFilesByProject(projectId) {
      try {
        const res = await FileService.getAllFiles({ project_id: projectId });
        this.filesByProject[projectId] = res || [];
      } catch (err) {
        console.error("Lỗi load file theo project:", err);
      }
    },

    async loadFilesByUser(projectId, userId) {
      try {
        const key = `${projectId}_${userId}`;
        const res = await FileService.getAllFiles({
          project_id: projectId,
          created_by: userId,
        });

        this.$patch((state) => {
          state.filesByUserInProject[key] = res || [];
        });
      } catch (err) {
        console.error("Lỗi load file theo user:", err);
      }
    },

    addFile(taskId, file) {
      if (!this.filesByTask[taskId]) this.filesByTask[taskId] = [];
      this.filesByTask[taskId].push(file);
    },
  },

  getters: {
    getFilesByTask: (state) => (taskId) => state.filesByTask[taskId] || [],
    getFilesByProject: (state) => (projectId) =>
      state.filesByProject[projectId] || [],
    getFilesByUser: (state) => (projectId, userId) =>
      state.filesByUserInProject[`${projectId}_${userId}`] || [],
  },
});