import createApiClient from "./api.service";

class OllamaService {
    constructor(baseUrl = "/api/ai") {
        this.api = createApiClient(baseUrl);
    }

    async generateTasks(data) {
        return (await this.api.post("/", data)).data;
    }
}

export default new OllamaService();