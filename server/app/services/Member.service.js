class MemberService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractMemberData(payload) {
        return {
            project_id: payload.project_id ?? null,
            user_id: payload.user_id ?? null,
            role: payload.role ?? "member",
            invited_by: payload.invited_by ?? null,
        };
    }

    async create(payload) {
        const member = await this.extractMemberData(payload);
        console.log(member);
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                "INSERT INTO project_members (project_id, user_id, role, status, invited_by) VALUES (?, ?, ?, ?, ?)",
                [
                    member.project_id,
                    member.user_id,
                    member.role,
                    'invited',
                    member.invited_by
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
        if (filter.status) {
            sql += " AND status = ?";
            params.push(filter.status);
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
        await this.mysql.execute(
            "DELETE FROM project_members WHERE id = ?",
            [id]
        );
        return id;
    }

    async getInviteList(userId) {
        const sql = `
            SELECT pm.*, u.name AS invited_by_name, p.name AS project_name
            FROM project_members pm
            JOIN users u ON pm.invited_by = u.id
            JOIN projects p ON pm.project_id = p.id
            WHERE 
                pm.user_id = ?
                AND pm.status = 'invited'
                AND pm.deleted_at IS NULL
        `;
        const [rows] = await this.mysql.execute(sql, [userId]);
        return rows;
    }

    async checkIfMemberExists(projectId, userId) {
        const sql = `
            SELECT COUNT(*) AS count
            FROM project_members
            WHERE 
                project_id = ?
                AND user_id = ?
                AND deleted_at IS NULL
        `;
        const [rows] = await this.mysql.execute(sql, [projectId, userId]);
        return rows[0].count > 0;
    }
}

module.exports = MemberService;