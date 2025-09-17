const bcrypt = require("bcrypt");

class AccountService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractAuthData(payload) {
        const auth = {
            email: payload.email,
            ten: payload.ten,
            gioiTinh: payload.gioiTinh ?? "Nam",
            SDT: payload.SDT,
            diaChi: payload.diaChi,
            avatar: payload.avatar ?? 1,
            deactive: payload.deactive ?? null,
            admin: payload.admin ?? false,
        };
        Object.keys(auth).forEach((key) => {
            if (auth[key] === undefined) delete auth[key];
        });
        return auth;
    }

    async create(payload) {
        if (!payload) throw new Error("Không có dữ liệu đầu vào");
        if (!payload.ten) throw new Error("Cần có tên người dùng");
        if (!payload.email) throw new Error("Cần có email");

        // Kiểm tra trùng email
        const [email] = await this.mysql.execute(
            "SELECT id FROM TaiKhoan WHERE email = ?",
            [payload.email]
        );
        if (email.length > 0) throw new Error("Tài khoản đã tồn tại");

        //Kiểm tra tên
        const [name] = await this.mysql.execute(
            "SELECT id FROM TaiKhoan WHERE ten = ?",
            [payload.ten]
        );
        if (name.length > 0) throw new Error("Tên người dùng đã tồn tại");

        // Mật khẩu mặc định
        if (!payload.Password) payload.Password = "defaultPW";

        const auth = await this.extractAuthData(payload);
        const connection = await this.mysql.getConnection();

        try {
            await connection.beginTransaction();

            const hashedPassword = await bcrypt.hash(payload.Password, 10);
            const updateAt = new Date();

            const [result] = await connection.execute(
                `INSERT INTO TaiKhoan (email, ten, gioiTinh, SDT, diaChi, vaiTro, Password, deactive, avatar, idPhong, updateAt, admin)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    auth.email,
                    auth.ten,
                    auth.gioiTinh,
                    auth.SDT,
                    auth.diaChi,
                    auth.vaiTro,
                    hashedPassword,
                    auth.deactive,
                    auth.avatar,
                    auth.idPhong,
                    updateAt,
                    auth.admin ? 1 : 0
                ]
            );

            const autoId = result.insertId;
            const newId = "AC" + autoId.toString().padStart(6, "0");
            await connection.execute(
                "UPDATE TaiKhoan SET id = ? WHERE autoId = ?",
                [newId, autoId]
            );

            await connection.commit();

            return { id: newId, email: auth.email, vaiTro: auth.vaiTro };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async find(filter = {}) {
        let sql = `SELECT * FROM TaiKhoan WHERE deactive IS NULL`;
        const params = [];

        if (filter.email) {
            sql += " AND email LIKE ?";
            params.push(`%${filter.email}%`);
        }
        if (filter.vaiTro) {
            sql += " AND vaiTro = ?";
            params.push(filter.vaiTro);
        }
        if (filter.ten) {
            sql += " AND ten LIKE ?";
            params.push(`%${filter.ten}%`);
        }

        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            `SELECT * FROM TaiKhoan WHERE autoId = ? AND deactive IS NULL`,
            [id]
        );
        return rows[0] || null;
    }

    async update(id, payload) {
        const update = await this.extractAuthData(payload);
        let sql = "UPDATE TaiKhoan SET ";
        const fields = [];
        const params = [];
        for (const key in update) {
            if (key === "id") continue;
            if (key === "Password") continue;
            fields.push(`${key} = ?`);
            params.push(update[key]);
        }
        if (payload.Password) {
            fields.push("Password = ?");
            params.push(await bcrypt.hash(payload.Password, 10));
            fields.push("updateAt = ?");
            params.push(new Date());
        }
        sql += fields.join(", ") + " WHERE autoId = ?";
        params.push(id);

        await this.mysql.execute(sql, params);
        return this.findById(id);
    }

    async delete(id) {
        const user = await this.findById(id);
        if (!user) return null;
        const deletedAt = new Date();
        await this.mysql.execute("UPDATE TaiKhoan SET deactive = ? WHERE autoId = ?", [deletedAt, id]);
        return { ...user, deactive: deletedAt };
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE TaiKhoan SET deactive = NULL WHERE autoId = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    async deleteAll() {
        const deletedAt = new Date();
        await this.mysql.execute("UPDATE TaiKhoan SET deactive = ?", [deletedAt]);
        return true;
    }

    async comparePassword(inputPassword, storedPassword) {
        return await bcrypt.compare(inputPassword, storedPassword);
    }

    async login(identifier, Password) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM TaiKhoan WHERE email = ? OR ten = ?",
            [identifier, identifier]
        );
        const auth = rows[0];
        if (!auth) throw new Error("Tài khoản không tồn tại");
        if (!(await this.comparePassword(Password, auth.password))) {
            throw new Error("Mật khẩu không đúng");
        }
        return { ...auth };
    }

    async getAvatar(id) {
        const [userRows] = await this.mysql.execute(
            "SELECT avatar FROM TaiKhoan WHERE autoId = ?",
            [id]
        );
        if (!userRows.length || !userRows[0].avatar) return null;

        const idFile = userRows[0].avatar;

        const [fileRows] = await this.mysql.execute(
            "SELECT duongDan FROM PhienBan WHERE idFile = ? ORDER BY ngayUpload DESC LIMIT 1",
            [idFile]
        );
        if (!fileRows.length) return null;

        return fileRows[0].duongDan;
    }

    async getDeactive(filter = {}) {
        let sql = "SELECT * FROM TaiKhoan WHERE deactive IS NOT NULL";
        let params = [];
        if (filter.email) {
            sql += " AND email LIKE ?";
            params.push(`%${filter.email}%`);
        }
        if (filter.vaiTro) {
            sql += " AND vaiTro = ?";
            params.push(filter.vaiTro);
        }
        if (filter.ten) {
            sql += " AND ten LIKE ?";
            params.push(`%${filter.ten}%`);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async changePassword(id, oldPassword, newPassword) {
        const [rows] = await this.mysql.execute(
            "SELECT Password FROM TaiKhoan WHERE autoId = ?",
            [id]
        );
        if (rows.length === 0) {
            const error = new Error("Tài khoản không tồn tại");
            error.statusCode = 404;
            throw error;
        }

        const storedPassword = rows[0].Password;
        if (!(await this.comparePassword(oldPassword, storedPassword))) {
            const error = new Error("Mật khẩu cũ không đúng");
            error.statusCode = 400;
            throw error;
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await this.mysql.execute(
            "UPDATE TaiKhoan SET Password = ?, updateAt = ? WHERE autoId = ?",
            [hashedNewPassword, new Date(), id]
        );

        return { message: "Đổi mật khẩu thành công" };
    }

    async getAssignNumber(id) {
        const [rows] = await this.mysql.execute(
            `SELECT COUNT(DISTINCT PhanCong.idCongViec) AS count
            FROM TaiKhoan
            JOIN PhanCong ON TaiKhoan.autoId = PhanCong.idNguoiNhan
            WHERE TaiKhoan.autoId = ? 
            AND TaiKhoan.deactive IS NULL 
            AND PhanCong.trangThai = 'Đang thực hiện'`,
            [id]
        );
        return rows[0].count;
    }
    
}

module.exports = AccountService;