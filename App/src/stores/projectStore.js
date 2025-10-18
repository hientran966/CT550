import { defineStore } from "pinia";
import ProjectService from "@/services/Project.service";

export const useProjectStore = defineStore("project", {
  state: () => ({
    projects: [],
    loading: false,
  }),

  actions: {
    async fetchProjects() {
      try {
        this.loading = true;
        const user = JSON.parse(localStorage.getItem("user"));
        this.projects = await ProjectService.getProjectsByAccountId(user.id);
      } catch (err) {
        console.error("Lỗi load project:", err);
      } finally {
        this.loading = false;
      }
    },

    async updateProject(updatedProject) {
      await ProjectService.updateProject(updatedProject.id, updatedProject);
      const index = this.projects.findIndex(p => p.id === updatedProject.id);
      if (index !== -1) this.projects[index] = updatedProject;
    },

    addProject(newProject) {
      this.projects.push(newProject);
    },
  },
});
