import createApiClient from "./api.service";

class ChatService {
    constructor(baseUrl = "/api/chat") {
        this.api = createApiClient(baseUrl);
    }

    // Channel methods
    async createChannel(data) {
        return (await this.api.post("/", data)).data;
    }

    async getChannelsByProject(projectId) {
        return (await this.api.get(`/project/${projectId}`)).data;
    }

    async updateChannel(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async deleteChannel(id) {
        return (await this.api.delete(`/${id}`)).data;
    }

    async restoreChannel(id) {
        return (await this.api.patch(`/restore/${id}`)).data;
    }

    // Member methods
    async getChannelMembers(channelId) {
        return (await this.api.get(`/${channelId}/members`)).data;
    }

    async addMember(data) {
        return (await this.api.post("/member", data)).data;
    }

    async removeMember(data) {
        return (await this.api.delete("/member", { data })).data;
    }

    // Message methods
    async sendMessage(data) {
        return (await this.api.post("/message", data)).data;
    }

    async getChannelMessages(channelId) {
        return (await this.api.get(`/${channelId}/messages`)).data;
    }

    async getThreadMessages(parentId) {
        return (await this.api.get(`/thread/${parentId}`)).data;
    }

    // Mention methods
    async addMentions(data) {
        return (await this.api.post("/mentions", data)).data;
    }
}

export default new ChatService();