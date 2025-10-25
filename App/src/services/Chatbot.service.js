import createApiClient from "./api.service";

class ChatService {
    constructor(baseUrl = "/api/ask") {
        this.api = createApiClient(baseUrl);
    }

    async createQuestion(data) {
        return (await this.api.post("/", data)).data;
    }

    async getHistory() {
        return (await this.api.get(`/history`)).data;
    }

    async updateHistory(id, data) {
        return (await this.api.put(`/history/${id}`, data)).data;
    }

    async deleteHistory(id) {
        return (await this.api.delete(`/history/${id}`)).data;
    }

    async getHistoryByProject(projectId, userId) {
        return (await this.api.get(`/history/project/${projectId}/user/${userId}`)).data;
    }
}

export default new ChatService();