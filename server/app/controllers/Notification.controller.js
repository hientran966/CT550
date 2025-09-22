const ApiError = require("../api-error");
const MySQL = require("../utils/mysql.util");
const NotificationService = require("../services/Notification.service");

// Tạo thông báo
exports.create = async (req, res, next) => {
    if (!req.body.noiDung) {
        return next(new ApiError(400, "Nội dung không được để trống"));
    }

    try {
        const notificationService = new NotificationService(MySQL.pool);
        const document = await notificationService.create(req.body);
        return res.send(document);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi tạo thông báo"));
    }
};

// Lấy tất cả thông báo (có filter và phân trang)
exports.findAll = async (req, res, next) => {
    try {
        const notificationService = new NotificationService(MySQL.pool);
        const {
            noiDung, tieuDe, ngayDang, idNguoiDang,
            idPhanCong, idCongViec, idDuAn, idPhanHoi,
            page = 1, pageSize = 20
        } = req.query;

        const filter = {
            noiDung, tieuDe, ngayDang, idNguoiDang,
            idPhanCong, idCongViec, idDuAn, idPhanHoi
        };

        Object.keys(filter).forEach((key) => {
            if (filter[key] == null || filter[key] === '') {
                delete filter[key];
            }
        });

        const documents = await notificationService.find(filter, {
            page: Number(page),
            pageSize: Number(pageSize)
        });

        return res.send(documents);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy danh sách thông báo"));
    }
};

// Lấy thông báo theo ID
exports.findOne = async (req, res, next) => {
    try {
        const notificationService = new NotificationService(MySQL.pool);
        const document = await notificationService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Thông báo không tồn tại"));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(500, error.message || `Đã xảy ra lỗi khi lấy thông báo với id=${req.params.id}`)
        );
    }
};

// Cập nhật thông báo
exports.update = async (req, res, next) => {
    if (!req.body.noiDung) {
        return next(new ApiError(400, "Nội dung không được để trống"));
    }

    try {
        const notificationService = new NotificationService(MySQL.pool);
        const updated = await notificationService.update(req.params.id, req.body);
        if (!updated) {
            return next(new ApiError(404, "Thông báo không tồn tại hoặc không có gì để cập nhật"));
        }
        return res.send(updated);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi cập nhật thông báo"));
    }
};

// Xoá thông báo
exports.delete = async (req, res, next) => {
    try {
        const notificationService = new NotificationService(MySQL.pool);
        const result = await notificationService.delete(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Thông báo không tồn tại"));
        }
        return res.send({ message: "Thông báo đã được xóa thành công" });
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi xóa thông báo"));
    }
};

// Xoá tất cả thông báo (set deactive)
exports.deleteAll = async (req, res, next) => {
    try {
        const notificationService = new NotificationService(MySQL.pool);
        await notificationService.deleteAll();
        return res.send({ message: "Xóa tất cả thông báo thành công" });
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi xóa tất cả thông báo"));
    }
};
