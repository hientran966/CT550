const MemberService = require("./Member.service");

class ProjectService {
  constructor(mysql) {
    this.mysql = mysql;
    this.memberService = new MemberService(mysql);
  }

  async extractProjectData(payload) {
    return {
      name: payload.name ?? null,
      description: payload.description ?? null,
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      status: payload.status ?? "Đang tiến hành",
      created_by: payload.created_by ?? null,
    };
  }

  async create(payload) {
    const project = await this.extractProjectData(payload);
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        "INSERT INTO projects (name, description, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [
          project.name,
          project.description,
          project.start_date,
          project.end_date,
          project.status,
          project.created_by,
        ]
      );

      const projectId = result.insertId;

      await this.memberService.create(
        {
          project_id: projectId,
          user_id: project.created_by,
          role: "owner",
          status: "accepted",
        },
        connection
      );

      if (Array.isArray(payload.members) && payload.members.length > 0) {
        for (const m of payload.members) {
          await this.memberService.create(
            {
              project_id: projectId,
              user_id: m.user_id,
              role: m.role ?? "member",
              invited_by: project.created_by,
              status: "invited",
            },
            connection
          );
        }
      }

      await connection.commit();
      return { id: projectId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async find(filter = {}) {
    let sql = "SELECT * FROM projects WHERE deleted_at IS NULL";
    const params = [];

    if (filter.name) {
      sql += " AND name LIKE ?";
      params.push(`%${filter.name}%`);
    }
    if (filter.status) {
      sql += " AND status = ?";
      params.push(filter.status);
    }
    if (filter.created_by) {
      sql += " AND created_by = ?";
      params.push(filter.created_by);
    }
    if (filter.start_date) {
      sql += " AND start_date >= ?";
      params.push(filter.start_date);
    }
    if (filter.end_date) {
      sql += " AND end_date <= ?";
      params.push(filter.end_date);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.mysql.execute(
      "SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL",
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

    const sql = `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);

    await this.mysql.execute(sql, params);
    return this.findById(id);
  }

  async delete(id) {
    const deletedDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    await this.mysql.execute(
      "UPDATE projects SET deleted_at = ? WHERE id = ?",
      [deletedDate, id]
    );
    return id;
  }

  async getByUser(userId) {
    const sql = `
      SELECT DISTINCT 
        p.*, 
        (
          SELECT JSON_ARRAYAGG(pm2.user_id)
          FROM project_members pm2
          WHERE pm2.project_id = p.id AND pm2.status = 'accepted'
        ) AS members
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE 
        (
          p.created_by = ? 
          OR (pm.user_id = ? AND pm.status = 'accepted')
        )
        AND p.deleted_at IS NULL
    `;
    const [rows] = await this.mysql.execute(sql, [userId, userId]);
    return rows;
  }
}

module.exports = ProjectService;