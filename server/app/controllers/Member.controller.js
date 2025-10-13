const { createController } = require("./controllerFactory");
const MemberService = require("../services/Member.service");
const ApiError = require("../api-error");
const MySQL = require("../utils/mysql.util");

const baseController = createController(MemberService, {
    create: "Đã xảy ra lỗi khi thêm thành viên",
    findAll: "Đã xảy ra lỗi khi lấy danh sách thành viên",
    findOne: "Đã xảy ra lỗi khi lấy thông tin thành viên",
    notFound: "Thành viên không tồn tại",
    update: "Đã xảy ra lỗi khi cập nhật thông tin thành viên",
    delete: "Đã xảy ra lỗi khi xóa thành viên",
    restore: "Đã xảy ra lỗi khi khôi phục thành viên"
});

const customMethods = {
    getInviteList: async (req, res, next) => {
        try {
            const service = new MemberService(MySQL.connection);
            const documents = await service.getInviteList(req.params.id);
            return res.send(documents);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy danh sách lời mời"));
        }
    },
    checkIfMemberExists: async (req, res, next) => {
        try {
            const service = new MemberService(MySQL.connection);
            const exists = await service.checkIfMemberExists(req.params.project_id, req.params.user_id);
            return res.send({ exists });
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi kiểm tra thành viên"));
        }
    }
};

module.exports = {
    ...baseController,
    ...customMethods
};