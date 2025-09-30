const { createController } = require("./controllerFactory");
const FileService = require("../services/File.service");
const ApiError = require("../api-error");
const MySQL = require("../utils/mysql.util");

const baseController = createController(FileService, {
    create: "Đã xảy ra lỗi khi tạo file",
    findAll: "Đã xảy ra lỗi khi lấy danh sách file",
    findOne: "Đã xảy ra lỗi khi lấy file",
    notFound: "File không tồn tại",
    update: "Đã xảy ra lỗi khi cập nhật file",
    delete: "Đã xảy ra lỗi khi xóa file",
    deleteSuccess: "Xóa file thành công",
    deleteAllSuccess: "Xóa tất cả file thành công"
});

// custom methods
const customMethods = {
    findAllVersion: async (req, res, next) => {
        try {
            const service = new FileService(MySQL.connection);
            const docs = await service.findVersion(req.params.id);
            if (!docs) return next(new ApiError(404, "File không tồn tại"));
            return res.json(docs);
        } catch (err) {
            console.error(err);
            return next(new ApiError(500, "Đã xảy ra lỗi khi lấy tất cả phiên bản file"));
        }
    },

    findVersion: async (req, res, next) => {
        try {
            const service = new FileService(MySQL.connection);
            const doc = await service.findVersionById(req.params.id);
            if (!doc) return next(new ApiError(404, "File không tồn tại"));
            return res.json(doc);
        } catch (err) {
            console.error(err);
            return next(new ApiError(500, "Đã xảy ra lỗi khi lấy phiên bản file"));
        }
    },

    addVersion: async (req, res, next) => {
        try {
            const service = new FileService(MySQL.connection);
            const doc = await service.addVersion(req.params.id, req.body);
            if (!doc) return next(new ApiError(404, "File không tồn tại"));
            return res.json(doc);
        } catch (err) {
            console.error(err);
            return next(new ApiError(500, "Đã xảy ra lỗi khi thêm phiên bản file"));
        }
    },

    uploadAvatar: async (req, res, next) => {
        const { file_name } = req.body;
        if (!file_name ) {
            return next(new ApiError(400, "Thiếu dữ liệu file hoặc nội dung file"));
        }
        try {
            const service = new FileService(MySQL.pool);
            const result = await service.updateAvatar(req.params.id, req.body);
            return res.json({ message: "Cập nhật ảnh đại diện thành công", result });
        } catch (err) {
            console.error(err);
            return next(new ApiError(500, "Đã xảy ra lỗi khi cập nhật avatar"));
        }
    }
};

module.exports = { ...baseController, ...customMethods };
