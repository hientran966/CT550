const ApiError = require("../api-error");
const MySQL = require("../utils/mysql.util");
const path = require("path");
const fs = require("fs");
const ContactService = require("../services/Contact.service");

//Tạo liên hệ
exports.create = async (req, res, next) => {
    if (!req.body.ownerId) {
        return next(new ApiError(400, "Cần có ownerId"));
    }
    if (!req.body.contactId) {
        return next(new ApiError(400, "Cần có contactId"));
    }
    if (req.body.ownerId === req.body.contactId) {
        return next(new ApiError(400, "ownerId và contactId không được trùng nhau"));
    }
    try {
        const contactService = new ContactService(MySQL.pool);
        const document = await contactService.create(req.body);
        return res.send(document);
    } catch (error) {
        console.error(error);
        return next(
            new ApiError(500, error.message || "Đã xảy ra lỗi khi tạo liên hệ")
        );
    }
};

//Lấy tất cả liên hệ
exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const contactService = new ContactService(MySQL.connection);
        //Nếu có tham số tìm kiếm thì tìm kiếm theo tham số đó
        const {ownerId, contactId} = req.query;
        if (ownerId || contactId) {
            documents = await contactService.find({
                ownerId,
                contactId
            });
        } else {
            documents = await contactService.find({});
        }
    } catch (error) {
        console.error(error);
        return next(
            new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy danh sách liên hệ")
        );
    }
    return res.send(documents);
};

//Lấy liên hệ theo id
exports.findOne = async (req, res, next) => {
    try {
        const contactService = new ContactService(MySQL.connection);
        const document = await contactService.findById(req.params.id);
        if (!document){
            return next(new ApiError(404, "Liên hệ không tồn tại"));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(
                500,
                error.message ||
                `Đã xảy ra lỗi khi lấy liên hệ với id=${req.params.id}`
            )
        );
    }
};

//Cập nhật liên hệ
exports.update = async (req, res, next) => {
    if (req.body.ownerId && !req.body.contactId) {
        return next(new ApiError(400, "Cần có contactId khi cập nhật ownerId"));
    }
    if (!req.body.ownerId && req.body.contactId) {
        return next(new ApiError(400, "Cần có ownerId khi cập nhật contactId"));
    }
    if (req.body.ownerId && req.body.contactId && req.body.ownerId === req.body.contactId) {
        return next(new ApiError(400, "ownerId và contactId không được trùng nhau"));
    }
    try {
        const contactService = new ContactService(MySQL.pool);
        const updated = await contactService.update(req.params.id, req.body);
        if (!updated) {
            return next(new ApiError(404, "Liên hệ không tồn tại hoặc không có gì để cập nhật"));
        }
        return res.send(updated);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi cập nhật liên hệ"));
    }
};

//Xoá liên hệ
exports.delete = async (req, res, next) => {
    try {
        const contactService = new ContactService(MySQL.pool);
        const result = await contactService.delete(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Liên hệ không tồn tại"));
        }
        return res.send({ message: "Liên hệ đã được xóa thành công" });
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi xóa liên hệ"));
    }
};

//Xoá nhiều liên hệ
exports.deleteAll = async (req, res, next) => {
    try {
        const contactService = new ContactService(MySQL.pool);
        const result = await contactService.deleteAll(req.body.ownerId, req.body.contactIds);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy liên hệ để xóa"));
        }
        return res.send({ message: "Các liên hệ đã được xóa thành công" });
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi xóa các liên hệ"));
    }
};