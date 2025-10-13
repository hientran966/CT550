import createApiClient from "./api.service";

class MemberService {
    constructor(baseUrl = "/api/thanhvien") {
        this.api = createApiClient(baseUrl);
    }

    async createMember(data) {
        return (await this.api.post("/", data)).data;
    }

    async getMemberById(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async updateMember(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async deleteMember(id) {
        return (await this.api.delete(`/${id}`)).data;
    }

    async getAllMembers() {
        return (await this.api.get("/")).data;
    }

    async getInviteList(userId) {
        return (await this.api.get(`/user/${userId}`)).data;
    }

    async checkIfMemberExists(projectId, userId) {
        return (await this.api.get(`/check/${projectId}/${userId}`)).data.exists;
    }
}

export default new MemberService();
