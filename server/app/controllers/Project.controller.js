const { createController } = require("./controllerFactory");
const ProjectService = require("../services/Project.service");
const ApiError = require("../api-error");
const MySQL = require("../utils/mysql.util");

const baseController = createController(ProjectService, {
    create: "Đã xảy ra lỗi khi tạo dự án",
    findAll: "Đã xảy ra lỗi khi lấy danh sách dự án",
    findOne: "Đã xảy ra lỗi khi lấy dự án",
    notFound: "Dự án không tồn tại",
    update: "Đã xảy ra lỗi khi cập nhật dự án",
    delete: "Đã xảy ra lỗi khi xóa dự án",
    deleteError: "Đã xảy ra lỗi khi xóa dự án",
    restore: "Khôi phục dự án thành công",
    restoreError: "Đã xảy ra lỗi khi khôi phục dự án",
});

const customMethods = {
    findByAccountId: async (req, res, next) => {
        try {
            const service = new ProjectService(MySQL.connection);
            const documents = await service.getByUser(req.params.id);
            return res.send(documents);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy dự án theo tài khoản"));
        }
    },
    getMember: async (req, res, next) => {
        try {
            const service = new ProjectService(MySQL.connection);
            const documents = await service.getMember(req.params.id);
            return res.send(documents);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy danh sách thành viên"));
        }
    },
};

module.exports = {
    ...baseController,
    ...customMethods
};