import createApiClient from "./api.service";

class TaskService {
    constructor(baseUrl = "/api/congviec") {
        this.api = createApiClient(baseUrl);
    }

    async createTask(data) {
        return (await this.api.post("/", data)).data;
    }

    async getTaskById(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async updateTask(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async deleteTask(id) {
        return (await this.api.delete(`/${id}`)).data;
    }

    async getAllTasks() {
        return (await this.api.get("/")).data;
    }

    async getByProject(projectId) {
        const res = await this.api.get(`/project/${projectId}`);
        return res.data;
    }

    async progressLog(id, data) {
        return (await this.api.post(`/${id}/progress`, data)).data;
    }
}

export default new TaskService();
