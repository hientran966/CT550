const { createController } = require("./controllerFactory");
const MemberService = require("../services/Member.service");

const baseController = createController(MemberService, {
    create: "Đã xảy ra lỗi khi thêm thành viên",
    findAll: "Đã xảy ra lỗi khi lấy danh sách thành viên",
    findOne: "Đã xảy ra lỗi khi lấy thông tin thành viên",
    notFound: "Thành viên không tồn tại",
    update: "Đã xảy ra lỗi khi cập nhật thông tin thành viên",
    delete: "Đã xảy ra lỗi khi xóa thành viên",
    restore: "Đã xảy ra lỗi khi khôi phục thành viên"
});

module.exports = {
    ...baseController
};