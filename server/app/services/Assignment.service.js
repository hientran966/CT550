class AssignmentService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractAssignmentData(payload) {
        return {
            moTa: payload.moTa ?? null,
            idCongViec: payload.idCongViec ?? null,
            tienDoCaNhan: payload.tienDoCaNhan ?? null,
            doQuanTrong: payload.doQuanTrong ?? null,
            idNguoiNhan: payload.idNguoiNhan ?? null,
            ngayNhan: payload.ngayNhan ?? null,
            ngayHoanTat: payload.ngayHoanTat ?? null,
            trangThai: payload.trangThai ?? "Chưa bắt đầu",
            deactive: payload.deactive ?? null,
        };
    }

    async extractReportData(payload) {
        return {
            moTa: payload.moTa ?? null,
            tienDoCaNhan: payload.tienDoCaNhan ?? null,
            trangThai: payload.trangThai ?? null,
            idNguoiGui: payload.idNguoiGui,
            ngayCapNhat: payload.ngayCapNhat ?? new Date(),
        };
    }

    async create(payload) {
        const assignment = await this.extractAssignmentData(payload);
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO PhanCong (idCongViec, doQuanTrong, tienDoCaNhan, idNguoiNhan, ngayNhan, ngayHoanTat, trangThai, moTa, deactive)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    assignment.idCongViec,
                    assignment.doQuanTrong,
                    assignment.tienDoCaNhan,
                    assignment.idNguoiNhan,
                    assignment.ngayNhan,
                    assignment.ngayHoanTat,
                    assignment.trangThai,
                    assignment.moTa,
                    assignment.deactive,
                ]
            );

            const autoId = result.insertId;
            const newId = "PC" + autoId.toString().padStart(6, "0");

            await connection.execute(
                "UPDATE PhanCong SET id = ? WHERE autoId = ?",
                [newId, autoId]
            );

            await connection.commit();
            return { id: newId, ...assignment };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async find(filter = {}) {
        let sql = "SELECT * FROM PhanCong WHERE deactive IS NULL";
        let params = [];
        if (filter.trangThai) {
            sql += " AND trangThai = ?";
            params.push(filter.trangThai);
        }
        if (filter.idNguoiNhan) {
            sql += " AND idNguoiNhan = ?";
            params.push(filter.idNguoiNhan);
        }
        if (filter.idCongViec) {
            sql += " AND idCongViec = ?";
            params.push(filter.idCongViec);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM PhanCong WHERE autoId = ? AND deactive IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async findByTask(taskId) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM PhanCong WHERE idCongViec = ? AND deactive IS NULL",
            [taskId]
        );
        return rows;
    }

    async update(id, payload) {
        const assignment = await this.extractAssignmentData(payload);
        let sql = "UPDATE PhanCong SET ";
        const fields = [];
        const params = [];
        for (const key in assignment) {
            if (key === "id") continue;
            fields.push(`${key} = ?`);
            params.push(assignment[key]);
        }
        sql += fields.join(", ") + " WHERE autoId = ?";
        params.push(id);
        await this.mysql.execute(sql, params);
        return { ...assignment, id };
    }

    async delete(id) {
        const assignment = await this.findById(id);
        if (!assignment) return null;
        const deletedAt = new Date();
        await this.mysql.execute(
            "UPDATE PhanCong SET deactive = ? WHERE autoId = ?",
            [deletedAt, id]
        );
        return { ...assignment, deactive: deletedAt, id };
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE PhanCong SET deactive = NULL WHERE autoId = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    async deleteAll() {
        const deletedAt = new Date();
        await this.mysql.execute(
            "UPDATE PhanCong SET deactive = ? WHERE deactive IS NULL",
            [deletedAt]
        );
        return true;
    }

    async report(idPhanCong, payload) {
        const assignment = await this.findById(idPhanCong);
        if (!assignment) return null;

        const idDinhKem = payload.idDinhKem || null;
        const connection = await this.mysql.getConnection();

        try {
            await connection.beginTransaction();
            const reportData = await this.extractReportData(payload);

            const [result] = await connection.execute(
                `INSERT INTO BaoCao
                (moTa, tienDoCaNhan, trangThai, idNguoiGui, idPhanCong, idDinhKem, ngayCapNhat)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    reportData.moTa,
                    reportData.tienDoCaNhan,
                    reportData.trangThai,
                    reportData.idNguoiGui,
                    idPhanCong,
                    idDinhKem,
                    reportData.ngayCapNhat || new Date(),
                ]
            );

            const autoId = result.insertId;
            const baoCaoId = "BC" + autoId.toString().padStart(6, "0");
            await connection.execute(
                "UPDATE BaoCao SET id = ? WHERE autoId = ?",
                [baoCaoId, autoId]
            );

            const fields = [];
            const params = [];
            if (reportData.tienDoCaNhan !== null) {
                fields.push("tienDoCaNhan = ?");
                params.push(reportData.tienDoCaNhan);
            }
            if (reportData.trangThai) {
                fields.push("trangThai = ?");
                params.push(reportData.trangThai);
            }
            if (fields.length) {
                if (
                    reportData.tienDoCaNhan !== null &&
                    Number(reportData.tienDoCaNhan) >= 100
                ) {
                    fields.push("ngayHoanTat = ?");
                    params.push(new Date());
                }

                params.push(idPhanCong);
                await connection.execute(
                    `UPDATE PhanCong SET ${fields.join(", ")} WHERE autoId = ?`,
                    params
                );
            }

            await connection.commit();
            return {
                baoCaoId,
                idDinhKem,
                updatedTienDo: reportData.tienDoCaNhan,
                updatedTrangThai: reportData.trangThai,
            };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    async getReportById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM BaoCao WHERE idPhanCong = ?",
            [id]
        );
        return rows;
    }
}

module.exports = AssignmentService;