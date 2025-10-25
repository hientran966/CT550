const { sendToUser } = require("../socket/index");

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

        const newRecord = {
            id: result.insertId,
            project_id,
            user_id,
            question,
            answer,
            intent,
        };

        if (user_id) {
            sendToUser(user_id, "chatbot_history", {
                action: "created",
                data: newRecord,
            });
        }

        return newRecord;
    }

    async find(filters = {}) {
        let sql = `SELECT * FROM chatbot_history WHERE 1=1`;
        const params = [];

        if (filters.project_id) {
            sql += ` AND project_id = ?`;
            params.push(filters.project_id);
        }
        if (filters.user_id) {
            sql += ` AND user_id = ?`;
            params.push(filters.user_id);
        }

        sql += ` ORDER BY created_at ASC`;
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

        if (result.affectedRows > 0) {
            const updated = await this.findById(id);
            if (updated.user_id) {
                sendToUser(updated.user_id, "chatbot_history", {
                    action: "updated",
                    data: updated,
                });
            }
            return updated;
        }

        return null;
    }

    async delete(id) {
        const record = await this.findById(id);
        if (!record) return false;

        const [result] = await this.mysql.execute(
            `DELETE FROM chatbot_history WHERE id = ?`,
            [id]
        );

        if (result.affectedRows > 0 && record.user_id) {
            sendToUser(record.user_id, "chatbot_history", {
                action: "deleted",
                data: { id },
            });
        }

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