class ChatbotHistoryService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async create({ project_id, user_id, question, answer, intent }) {
        const [result] = await this.mysql.execute(
            `INSERT INTO chatbot_history (project_id, user_id, question, answer, intent)
             VALUES (?, ?, ?, ?, ?)`,
            [project_id, user_id, question, answer, intent]
        );
        return { id: result.insertId, project_id, user_id, question, answer, intent };
    }

    async find(filters = {}) {
        let sql = `SELECT * FROM chatbot_history`;
        const params = [];

        if (filters.project_id) {
            sql += ` WHERE project_id = ?`;
            params.push(filters.project_id);
        }

        sql += ` ORDER BY created_at DESC`;

        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            `SELECT * FROM chatbot_history WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async update(id, data) {
        const fields = [];
        const values = [];

        if (data.answer !== undefined) {
            fields.push("answer = ?");
            values.push(data.answer);
        }
        if (data.intent !== undefined) {
            fields.push("intent = ?");
            values.push(data.intent);
        }

        if (fields.length === 0) return false;

        const sql = `UPDATE chatbot_history SET ${fields.join(", ")} WHERE id = ?`;
        values.push(id);

        const [result] = await this.mysql.execute(sql, values);
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await this.mysql.execute(
            `DELETE FROM chatbot_history WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    async deleteByProject(projectId) {
        const [result] = await this.mysql.execute(
            `DELETE FROM chatbot_history WHERE project_id = ?`,
            [projectId]
        );
        return result.affectedRows;
    }

    async restore(id) {
        return { message: "Restore không khả dụng (chưa có soft delete)" };
    }
}

module.exports = ChatbotHistoryService;