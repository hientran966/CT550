import { defineStore } from "pinia";
import ProjectService from "@/services/Project.service";

export const useProjectStore = defineStore("project", {
  state: () => ({
    projects: [],
    loading: false,
    searchTerm: "",
    statusFilter: null,
    dateRange: null,
  }),

  actions: {
    async fetchProjects() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) return;

      const data = await ProjectService.getProjectsByAccountId(user.id);

      this.projects = data.map(p => ({ ...p }));
      console.log("Projects reloaded:", this.projects.length);
    },

    async updateProject(payload) {
      await ProjectService.updateProject(payload.id, payload);

      await this.fetchProjects();
    },
    
    addProject(newProject) {
      this.projects.push(newProject);
    },

    async getNameById(id) {
      await this.fetchProjects();
      const project = this.projects.find(p => p.id === id);

      return project
        ? "Project#" + project.id + " - " + project.name
        : "Dự án không xác định";
    },

    setSearch(term) {
      this.searchTerm = term.toLowerCase();
    },
    setStatusFilter(status) {
      this.statusFilter = status;
    },
    setDateRange(range) {
      this.dateRange = range;
    },
  },

  getters: {
    filteredProjects: (state) => {
      return state.projects.filter((p) => {
        const matchesSearch =
          !state.searchTerm || p.name.toLowerCase().includes(state.searchTerm);

        const matchesStatus =
          !state.statusFilter || p.status === state.statusFilter;

        return matchesSearch && matchesStatus;
      });
    },
  },
});
