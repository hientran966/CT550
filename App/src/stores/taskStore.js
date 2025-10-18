import { defineStore } from "pinia";
import TaskService from "@/services/Task.service";
import AssignService from "@/services/Assign.service";

export const useTaskStore = defineStore("task", {
  state: () => ({
    tasksByProject: {},
  }),

  getters: {
    getTasksByProject: (state) => (projectId) => state.tasksByProject[projectId] || [],
  },

  actions: {
    async loadTasks(projectId) {
      if (!projectId) return;
      try {
        const tasks = await TaskService.getByProject(projectId);
        this.tasksByProject = {
          ...this.tasksByProject,
          [projectId]: tasks || [],
        };
      } catch (err) {
        console.error("Lỗi khi load task:", err);
      }
    },

    async updateTask(projectId, updatedTask) {
      const user = JSON.parse(localStorage.getItem("user"));

      try {
        if (updatedTask.changedField === "progress") {
          await TaskService.progressLog(updatedTask.id, {
            progress: updatedTask.latest_progress,
            loggedBy: user.id,
          });
        } else if (updatedTask.changedField === "assignee") {
          await TaskService.deleteAssign(updatedTask.id);
          for (const userId of updatedTask.assignees) {
            await AssignService.createAssign({ task_id: updatedTask.id, user_id: userId, actor_id: user.id });
          }
        } else {
          await TaskService.updateTask(updatedTask.id, updatedTask);
        }

        const list = this.tasksByProject[projectId] || [];
        const idx = list.findIndex((t) => t.id === updatedTask.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updatedTask };
        } else {
          list.push(updatedTask);
        }
        this.tasksByProject = { ...this.tasksByProject, [projectId]: [...list] };
      } catch (err) {
        console.error("Lỗi cập nhật task:", err);
      }
    },

    async updateStatus(projectId, task) {
      try {
        await TaskService.updateTask(task.id, { status: task.status });
        const list = this.tasksByProject[projectId] || [];
        const idx = list.findIndex((t) => t.id === task.id);
        if (idx !== -1) list[idx].status = task.status;
        this.tasksByProject = { ...this.tasksByProject, [projectId]: [...list] };
      } catch (err) {
        console.error("Lỗi cập nhật status:", err);
      }
    },

    addTask(projectId, task) {
      const list = this.tasksByProject[projectId] || [];
      this.tasksByProject = {
        ...this.tasksByProject,
        [projectId]: [...list, task],
      };
    },
  },
});
