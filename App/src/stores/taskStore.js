import { defineStore } from "pinia";
import TaskService from "@/services/Task.service";
import AssignService from "@/services/Assign.service";

export const useTaskStore = defineStore("task", {
  state: () => ({
    tasksByProject: {},
    taskCache: {},
    loading: false,

    searchTerm: "",
    priorityFilter: null,
    assigneeFilter: null,
  }),

  getters: {
    getTasksByProject: (state) => (projectId) =>
      state.tasksByProject[projectId] || [],

    filteredTasksByProject: (state) => (projectId) => {
      const list = state.tasksByProject[projectId] || [];

      return list.filter((t) => {
        const matchesSearch =
          !state.searchTerm ||
          t.title?.toLowerCase().includes(state.searchTerm.toLowerCase());

        const matchesPriority =
          !state.priorityFilter ||
          (t.priority && t.priority.includes(state.priorityFilter));

        const matchesAssignee =
          !state.assigneeFilter ||
          (t.assignees && t.assignees.includes(state.assigneeFilter));

        return matchesSearch && matchesPriority && matchesAssignee;
      });
    },
  },

  actions: {
    async loadTasks(projectId) {
      if (!projectId) return;
      this.loading = true;
      try {
        const tasks = await TaskService.getByProject(projectId);
        this.tasksByProject = {
          ...this.tasksByProject,
          [projectId]: tasks || [],
        };
        console.log(this.tasksByProject)
        for (const t of tasks) {
          this.taskCache[t.id] = t;
        }
      } catch (err) {
        console.error("Lỗi khi load task:", err);
      } finally {
        this.loading = false;
      }
    },

    async loadTaskById(taskId) {
      if (this.taskCache[taskId]) {
        return this.taskCache[taskId];
      }
      try {
        const task = await TaskService.getTaskById(taskId);
        if (task) {
          this.taskCache[task.id] = task;
          const list = this.tasksByProject[task.project_id] || [];
          if (!list.some((t) => t.id === task.id)) {
            list.push(task);
            this.tasksByProject[task.project_id] = list;
          }
          return task;
        }
      } catch (err) {
        console.error("Lỗi khi load task theo ID:", err);
      }
      return null;
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
            await AssignService.createAssign({
              task_id: updatedTask.id,
              user_id: userId,
              actor_id: user.id,
              project_id: projectId,
            });
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
        this.taskCache[updatedTask.id] = updatedTask;
      } catch (err) {
        console.error("Lỗi cập nhật task:", err);
      }
    },

    async updateStatus(projectId, task) {
      try {
        await TaskService.updateTask(task.id, {
          status: task.status,
          project_id: projectId,
        });
        const list = this.tasksByProject[projectId] || [];
        const idx = list.findIndex((t) => t.id === task.id);
        if (idx !== -1) list[idx].status = task.status;
        this.tasksByProject = { ...this.tasksByProject, [projectId]: [...list] };
      } catch (err) {
        console.error("Lỗi cập nhật status:", err);
      }
    },

    async deleteTask(taskId) {
      try {
        await TaskService.deleteTask(taskId);
      } catch (err) {
        console.error("Lỗi xóa task:", err);
      }
    },

    addTask(projectId, task) {
      const list = this.tasksByProject[projectId] || [];
      this.tasksByProject = {
        ...this.tasksByProject,
        [projectId]: [...list, task],
      };
      this.taskCache[task.id] = task;
    },

    async getNameById(id) {
      if (!id) return "Không xác định";

      if (this.taskCache[id]) {
        return this.taskCache[id].title || "Không có tiêu đề";
      }

      try {
        const task = await TaskService.getTaskById(id);
        if (task) {
          this.taskCache[task.id] = task;
          if (task.project_id) {
            const list = this.tasksByProject[task.project_id] || [];
            if (!list.some((t) => t.id === task.id)) {
              list.push(task);
              this.tasksByProject[task.project_id] = list;
            }
          }
          return "Task#" + task.id + " - " + (task.title || "Không có tiêu đề");
        }
      } catch (err) {
        console.error("Lỗi khi lấy task theo ID:", err);
      }

      return "Công việc";
    },

    setSearch(term) {
      this.searchTerm = term.toLowerCase();
    },
    setPriorityFilter(priority) {
      this.priorityFilter = priority;
    },
    setAssigneeFilter(userId) {
      this.assigneeFilter = userId;
    },
  },
});