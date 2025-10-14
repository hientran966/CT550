class CommentService {
  constructor(mysql) {
    this.mysql = mysql;
  }

  async extractCommentData(payload) {
    return {
      user_id: payload.user_id ?? null,
      task_id: payload.task_id ?? null,
      file_id: payload.file_id ?? null,
      file_version_id: payload.file_version_id ?? null,
      content: payload.content ?? null
    };
  }

  async create(payload) {
    const comment = await this.extractCommentData(payload);
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO comments (user_id, task_id, file_id, file_version_id, content)
        VALUES (?, ?, ?, ?, ?)`,
        [
          comment.user_id,
          comment.task_id,
          comment.file_id,
          comment.file_version_id,
          comment.content
        ]
      );

      await connection.commit();
      return { id: result.insertId, ...comment };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async find(filter = {}) {
    let sql = `
      SELECT 
        c.*,
        u.name AS user_name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.deleted_at IS NULL;
    `;

    let params = [];

    if (filter.user_id) {
      sql += " AND c.user_id = ?";
      params.push(`%${filter.user_id}%`);
    }
    if (filter.task_id) {
      sql += " AND c.task_id = ?";
      params.push(filter.task_id);
    }
    if (filter.file_id) {
      sql += " AND c.file_id = ?";
      params.push(`%${filter.file_id}%`);
    }
    if (filter.file_version_id) {
      sql += " AND c.file_version_id = ?";
      params.push(`%${filter.file_version_id}%`);
    }
    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.mysql.execute(
      "SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return rows[0] || null;
  }

  async update(id, payload) {
    const allowedFields = ["content"];
    const fields = [];
    const params = [];
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        fields.push(`${key} = ?`);
        params.push(payload[key]);
      }
    }
    if (fields.length === 0) {
      return await this.findById(id);
    }
    const sql = `UPDATE comments SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);
    await this.mysql.execute(sql, params);
    return { ...(await this.findById(id)) };
  }

  async delete(id) {
    const user = await this.findById(id);
    if (!user) return null;
    const deletedAt = new Date();
    await this.mysql.execute("UPDATE comments SET deleted_at = ? WHERE id = ?", [
      deletedAt,
      id,
    ]);
    return { ...user, deleted_at: deletedAt };
  }

  async restore(id) {
    const [result] = await this.mysql.execute(
      "UPDATE comments SET deleted_at = NULL WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = CommentService;
