const { create } = require("../controllers/Task.controller");

class CalendarService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractCalendarData(payload) {
        return {
            tieuDe: payload.tieuDe,
            ngayBD: payload.ngayBD,
            ngayKT: payload.ngayKT,
            deactive: payload.deactive ?? null,
            idDuAn: payload.idDuAn ?? null,
        };
    }

    async create(payload) {
        const calendar = await this.extractCalendarData(payload);
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                "INSERT INTO LichNghi (tieuDe, ngayBD, ngayKT, deactive, idDuAn) VALUES (?, ?, ?, ?, ?)",
                [
                    calendar.tieuDe,
                    calendar.ngayBD,
                    calendar.ngayKT,
                    calendar.deactive,
                    calendar.idDuAn,
                ]
            );

            const autoId = result.insertId;
            const newId = "LN" + autoId.toString().padStart(6, "0");

            await connection.execute(
                "UPDATE LichNghi SET id = ? WHERE autoId = ?",
                [newId, autoId]
            );

            await connection.commit();
            return { id: newId, ...calendar };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async find(filter = {}) {
        let sql = "SELECT * FROM LichNghi WHERE deactive IS NULL";
        let params = [];
        if (filter.tieuDe) {
            sql += " AND tieuDe LIKE ?";
            params.push(`%${filter.tieuDe}%`);
        }
        if (filter.ngayBD) {
            sql += " AND ngayBD >= ?";
            params.push(filter.ngayBD);
        }
        if (filter.ngayKT) {
            sql += " AND ngayKT <= ?";
            params.push(filter.ngayKT);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }
    
    async findById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM LichNghi WHERE autoId = ? AND deactive IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async update(id, payload) {
        const calendar = await this.extractCalendarData(payload);
        let sql = "UPDATE LichNghi SET ";
        const fields = [];
        const params = [];
        for (const key in calendar) {
            if (key === "id") continue;
            fields.push(`${key} = ?`);
            params.push(calendar[key]);
        }
        sql += fields.join(", ") + " WHERE autoId = ?";
        params.push(id);
        const [result] = await this.mysql.execute(sql, params);
        if (result.affectedRows === 0) {
            throw new Error("LichNghi not found");
        }
        return { id: calendar.id, tieuDe: calendar.tieuDe };
    }

    async delete(id) {
        const [result] = await this.mysql.execute(
            "UPDATE LichNghi SET deactive = NOW() WHERE autoId = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error("LichNghi not found");
        }
        return { id };
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE LichNghi SET deactive = NULL WHERE autoId = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    async deleteAll() {
        const deletedAt = new Date();
        await this.mysql.execute(
            "UPDATE LichNghi SET deactive = ?",
            [deletedAt]
        );
        return deletedAt;
    }

}

module.exports = CalendarService;