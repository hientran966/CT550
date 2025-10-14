import createApiClient from "./api.service";

class CommentService {
    constructor(baseUrl = "/api/binhluan") {
        this.api = createApiClient(baseUrl);
    }

    async createComment(data) {
        return (await this.api.post("/", data)).data;
    }

    async getCommentById(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async updateComment(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async deleteComment(id) {
        return (await this.api.delete(`/${id}`)).data;
    }

    async getAllComments() {
        return (await this.api.get("/")).data;
    }

}

export default new CommentService();
