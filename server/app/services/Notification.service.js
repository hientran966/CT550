class NotificationService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractNotificationData(payload) {
        return {
            tieuDe: payload.tieuDe ?? null,
            noiDung: payload.noiDung,
            idNguoiDang: payload.idNguoiDang,
            ngayDang: payload.ngayDang ?? new Date(),
            deactive: payload.deactive ?? null,
            idPhanCong: payload.idPhanCong ?? null,
            idCongViec: payload.idCongViec ?? null,
            idDuAn: payload.idDuAn ?? null,
            idPhanHoi: payload.idPhanHoi ?? null,
            idPhienBan: payload.idPhienBan ?? null,
            idNguoiNhan: payload.idNguoiNhan ?? null,
        };
    }

    async create(payload) {
        const notification = await this.extractNotificationData(payload);
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO ThongBao (tieuDe, noiDung, idNguoiDang, ngayDang, deactive, idPhanCong, idCongViec, idDuAn, idPhanHoi, idPhienBan, idNguoiNhan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    notification.tieuDe,
                    notification.noiDung,
                    notification.idNguoiDang,
                    notification.ngayDang,
                    notification.deactive,
                    notification.idPhanCong,
                    notification.idCongViec,
                    notification.idDuAn,
                    notification.idPhanHoi,
                    notification.idPhienBan,
                    notification.idNguoiNhan,
                ]
            );

            const autoId = result.insertId;
            const newId = "TB" + autoId.toString().padStart(6, "0");

            await connection.execute(
                "UPDATE ThongBao SET id = ? WHERE autoId = ?",
                [newId, autoId]
            );

            await connection.commit();
            return { id: newId, ...notification };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async find(filter = {}) {
        let sql = "SELECT * FROM ThongBao WHERE deactive IS NULL";
        let params = [];

        if (filter.tieuDe) {
            sql += " AND tieuDe LIKE ?";
            params.push(`%${filter.tieuDe}%`);
        }
        if (filter.idNguoiDang) {
            sql += " AND idNguoiDang = ?";
            params.push(filter.idNguoiDang);
        }
        if (filter.idNguoiNhan) {
            sql += " AND idNguoiNhan = ?";
            params.push(filter.idNguoiNhan);
        }
        if (filter.idDuAn) {
            sql += " AND idDuAn = ?";
            params.push(filter.idDuAn);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM ThongBao WHERE autoId = ? AND deactive IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async update(id, payload) {
        const notification = this.extractNotificationData(payload);
        let sql = "UPDATE ThongBao SET ";
        const fields = [];
        const params = [];
        for (const key in notification) {
            if (key === "id") continue;
            fields.push(`${key} = ?`);
            params.push(notification[key]);
        }
        sql += fields.join(", ") + " WHERE autoId = ?";
        params.push(id);
        await this.mysql.execute(sql, params);
        return { ...notification, id };
    }

    async delete(id) {
        const notification = await this.findById(id);
        if (!notification) return null;
        const deletedAt = new Date();
        await this.mysql.execute("UPDATE ThongBao SET deactive = ? WHERE autoId = ?", [
            deletedAt,
            id,
        ]);
        return { ...notification, deactive: deletedAt };
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE ThongBao SET deactive = NULL WHERE autoId = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    async deleteAll() {
        const deletedAt = new Date();
        await this.mysql.execute("UPDATE ThongBao SET deactive = ?", [deletedAt]);
        return true;
    }
}

module.exports = NotificationService;