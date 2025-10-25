import createApiClient from "./api.service";

class ProjectService {
    constructor(baseUrl = "/api/projects") {
        this.api = createApiClient(baseUrl);
    }

    async createProject(data) {
        return (await this.api.post("/", data)).data;
    }

    async getProjectById(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async updateProject(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async deleteProject(id) {
        return (await this.api.delete(`/${id}`)).data;
    }

    async getAllProjects() {
        return (await this.api.get("/")).data;
    }
    
    async getProjectsByAccountId(accountId) {
        return (await this.api.get(`/account/${accountId}`)).data;
    }

    async getReportData(id) {
        return (await this.api.get(`/${id}/report`)).data;
    }
}

export default new ProjectService();
