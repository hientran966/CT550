import { defineStore } from "pinia";
import FileService from "@/services/File.service";

export const useFileStore = defineStore("file", {
  state: () => ({
    filesByTask: {},
    filesByProject: {},
    filesByUserInProject: {},
    fileVersions: {},
  }),

  actions: {
    async loadFiles(taskId) {
      try {
        const res = await FileService.getAllFiles({ task_id: taskId });

        const files = (res || []).map((f) => ({
          ...f,
          versions: this.fileVersions[f.id] || [],
        }));

        this.filesByTask[taskId] = files;
      } catch (err) {
        console.error("Lỗi load file theo task:", err);
      }
    },

    async loadFilesByProject(projectId) {
      try {
        const res = await FileService.getAllFiles({ project_id: projectId });

        const files = (res || []).map((f) => ({
          ...f,
          versions: this.fileVersions[f.id] || [],
        }));

        this.filesByProject[projectId] = files;
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

        const files = (res || []).map((f) => ({
          ...f,
          versions: this.fileVersions[f.id] || [],
        }));

        this.$patch((state) => {
          state.filesByUserInProject[key] = files;
        });
      } catch (err) {
        console.error("Lỗi load file theo user:", err);
      }
    },

    async loadFileVersions(fileId) {
      try {
        const res = await FileService.getFileVersion(fileId);
        this.fileVersions[fileId] = res || [];

        this._patchVersionsIntoAllStores(fileId);
      } catch (err) {
        console.error("Lỗi load version:", err);
      }
    },

    _patchVersionsIntoAllStores(fileId) {
      const updateList = (list) =>
        list.map((f) =>
          f.id === fileId ? { ...f, versions: this.fileVersions[fileId] || [] } : f
        );

      Object.keys(this.filesByTask).forEach((taskId) => {
        this.filesByTask[taskId] = updateList(this.filesByTask[taskId]);
      });

      Object.keys(this.filesByProject).forEach((projectId) => {
        this.filesByProject[projectId] = updateList(this.filesByProject[projectId]);
      });

      Object.keys(this.filesByUserInProject).forEach((key) => {
        this.filesByUserInProject[key] = updateList(
          this.filesByUserInProject[key]
        );
      });
    },

    addFile(taskId, file) {
      if (!this.filesByTask[taskId]) this.filesByTask[taskId] = [];

      this.filesByTask[taskId].push({
        ...file,
        versions: this.fileVersions[file.id] || [],
      });
    },
  },

  getters: {
    getFilesByTask: (state) => (taskId) => state.filesByTask[taskId] || [],
    getFilesByProject: (state) => (projectId) =>
      state.filesByProject[projectId] || [],
    getFilesByUser: (state) => (projectId, userId) =>
      state.filesByUserInProject[`${projectId}_${userId}`] || [],
    getFileVersions: (state) => (fileId) =>
      state.fileVersions[fileId] || [],
  },
});