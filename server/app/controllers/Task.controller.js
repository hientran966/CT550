const { createController } = require("./controllerFactory");
const TaskService = require("../services/Task.service");
const ApiError = require("../api-error");
const MySQL = require("../utils/mysql.util");

// CRUD mặc định từ factory
const baseController = createController(TaskService, {
    create: "Đã xảy ra lỗi khi tạo công việc",
    findAll: "Đã xảy ra lỗi khi lấy danh sách công việc",
    findOne: "Đã xảy ra lỗi khi lấy công việc",
    notFound: "Công việc không tồn tại",
    update: "Đã xảy ra lỗi khi cập nhật công việc",
    delete: "Đã xảy ra lỗi khi xóa công việc",
    restore: "Đã xảy ra lỗi khi khôi phục công việc"
});

// Thêm method đặc thù
const customMethods = {
    // validate riêng cho create
    create: async (req, res, next) => {
        if (!req.body.title) {
            return next(new ApiError(400, "Tên công việc không được để trống"));
        }
        try {
            const service = new TaskService(MySQL.pool);
            const document = await service.create(req.body);
            return res.send(document);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi tạo công việc"));
        }
    },

    // filter theo project
    findByProject: async (req, res, next) => {
        try {
            const service = new TaskService(MySQL.connection);
            const documents = await service.find({ project_id: req.params.id });
            return res.send(documents);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy công việc theo dự án"));
        }
    },

    // filter theo account
    findByAccountId: async (req, res, next) => {
        try {
            const service = new TaskService(MySQL.connection);
            const documents = await service.findByAccountId(req.params.id);
            return res.send(documents);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy công việc theo tài khoản"));
        }
    },

    // log tiến độ công việc
    logProgress: async (req, res, next) => {
        const { progress, loggedBy } = req.body;

        if (progress == null || progress < 0 || progress > 100) {
            return next(new ApiError(400, "Tiến độ công việc không hợp lệ"));
        }
        try {
            const service = new TaskService(MySQL.pool);
            const document = await service.logProgress(req.params.id, progress, loggedBy);
            return res.send(document);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi log tiến độ công việc"));
        }
    },

    //Xóa phân công
    deleteAssign: async (req, res, next) => {
        try {
            const service = new TaskService(MySQL.pool);
            const document = await service.deleteAssign(req.params.id);
            return res.send(document);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi xóa phân công công việc"));
        }
    },

    getRole: async (req, res, next) => {
        try {
            const service = new TaskService(MySQL.connection);
            const role = await service.getRole(req.params.id, req.params.user_id);
            return res.send(role);
        } catch (error) {
            return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy quyền"));
        }
    },
};

module.exports = {
    ...baseController,
    ...customMethods
};
