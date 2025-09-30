class MemberService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractMemberData(payload) {
        return {
            project_id: payload.project_id ?? null,
            user_id: payload.user_id ?? null,
            role: payload.role ?? "member",
            joined_at: payload.joined_at ?? null,
        };
    }

    async create(payload) {
        const member = await this.extractMemberData(payload);
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                "INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)",
                [
                    member.project_id,
                    member.user_id,
                    member.role,
                    member.joined_at
                ]
            );

            await connection.commit();
            return { id: result.insertId, ...member };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async find(filter = {}) {
        let sql = "SELECT * FROM project_members WHERE deleted_at IS NULL";
        let params = [];
        
        if (filter.project_id) {
            sql += " AND project_id LIKE ?";
            params.push(`%${filter.project_id}%`);
        }
        if (filter.role) {
            sql += " AND role LIKE ?";
            params.push(`%${filter.role}%`);
        }
        if (filter.user_id) {
            sql += " AND user_id = ?";
            params.push(filter.user_id);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM project_members WHERE id = ? AND deleted_at IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async update(id, payload) {
        const fields = [];
        const params = [];

        for (const key in payload) {
            if (key === "id") continue;
            fields.push(`${key} = ?`);
            params.push(payload[key]);
        }

        if (fields.length === 0) {
            throw new Error("Không có trường nào để cập nhật.");
        }

        const sql = `UPDATE project_members SET ${fields.join(", ")} WHERE id = ?`;
        params.push(id);

        await this.mysql.execute(sql, params);
        return this.findById(id);
    }

    async delete(id) {
        const deletedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await this.mysql.execute(
            "UPDATE project_members SET deleted_at = ? WHERE id = ?",
            [deletedDate, id]
        );
        return id;
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE project_members SET deleted_at = NULL WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = MemberService;