const { createController } = require("./controllerFactory");
const ProjectService = require("../services/Project.service");

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

module.exports = {
    ...baseController
};