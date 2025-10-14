import createApiClient from "./api.service";

class NotificationService {
    constructor(baseUrl = "/api/thongbao") {
        this.api = createApiClient(baseUrl);
    }

    async createNotification(data) {
        return (await this.api.post("/", data)).data;
    }

    async getNotificationById(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async updateNotification(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async deleteNotification(id) {
        return (await this.api.delete(`/${id}`)).data;
    }

    async getAllNotifications() {
        return (await this.api.get("/")).data;
    }

}

export default new NotificationService();
