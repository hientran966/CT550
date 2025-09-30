class AssignmentService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractAssignmentData(payload) {
        return {
            task_id: payload.task_id ?? null,
            user_id: payload.user_id ?? null,
        };
    }

    async create(payload) {
        const assignment = await this.extractAssignmentData(payload);
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            const [existing] = await connection.execute(
                `SELECT id FROM task_assignees 
                WHERE task_id = ? AND user_id = ? AND deleted_at IS NULL`,
                [assignment.task_id, assignment.user_id]
            );

            if (existing.length > 0) {
                await connection.rollback();
                throw new Error("Phân công này đã tồn tại");
            }

            const [result] = await connection.execute(
                `INSERT INTO task_assignees (task_id,user_id)
                VALUES (?, ?)`,
                [
                    assignment.task_id,
                    assignment.user_id,
                ]
            );

            await connection.commit();
            return { id: result.insertId, ...assignment };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async find(filter = {}) {
        let sql = "SELECT * FROM task_assignees WHERE deleted_at IS NULL";
        let params = [];
        if (filter.user_id) {
            sql += " AND user_id = ?";
            params.push(filter.user_id);
        }
        if (filter.task_id) {
            sql += " AND task_id = ?";
            params.push(filter.task_id);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM task_assignees WHERE id = ? AND deleted_at IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async update(id, payload) {
        const assignment = await this.extractAssignmentData(payload);
        let sql = "UPDATE task_assignees SET ";
        const fields = [];
        const params = [];
        for (const key in assignment) {
            if (key === "id") continue;
            fields.push(`${key} = ?`);
            params.push(assignment[key]);
        }
        sql += fields.join(", ") + " WHERE id = ?";
        params.push(id);
        await this.mysql.execute(sql, params);
        return { ...assignment, id };
    }

    async delete(id) {
        const assignment = await this.findById(id);
        if (!assignment) return null;
        const deletedAt = new Date();
        await this.mysql.execute(
            "UPDATE task_assignees SET deleted_at = ? WHERE id = ?",
            [deletedAt, id]
        );
        return { ...assignment, deleted_at: deletedAt, id };
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE task_assignees SET deleted_at = NULL WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

}

module.exports = AssignmentService;