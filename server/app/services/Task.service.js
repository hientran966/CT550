const AssignmentService = require("./Assign.service");
const MemberService = require("./Member.service");
const { sendToUser } = require("../socket/index");

class TaskService {
  constructor(mysql) {
    this.mysql = mysql;
    this.assignmentService = new AssignmentService(mysql);
    this.memberService = new MemberService(mysql);
  }

  async extractTaskData(payload) {
    return {
      title: payload.title,
      description: payload.description ?? null,
      start_date: payload.start_date ?? null,
      due_date: payload.due_date ?? null,
      created_by: payload.created_by ?? null,
      project_id: payload.project_id ?? null,
    };
  }

  async create(payload) {
    const task = await this.extractTaskData(payload);
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO tasks (title, description, start_date, due_date, created_by, project_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          task.title,
          task.description,
          task.start_date,
          task.due_date,
          task.created_by,
          task.project_id,
        ]
      );

      const taskId = result.insertId;
      const newTask = { id: taskId, ...task };

      if (Array.isArray(payload.members) && payload.members.length > 0) {
        for (const userId of payload.members) {
          await this.assignmentService.create(
            {
              task_id: taskId,
              user_id: userId,
              actor_id: payload.created_by,
            },
            connection
          );
        }
      }

      await connection.commit();

      const members = await this.memberService.getByProjectId(task.project_id);

      if (members?.length > 0) {
        for (const member of members) {
          sendToUser(member.user_id, "task_updated", {
            task: newTask,
            message: `Task "${newTask.title}" vừa được tạo trong dự án ${newTask.project_id}`,
          });
        }
      }

      return newTask;
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
        t.*, 
        COALESCE((
          SELECT pl.progress
          FROM progress_logs pl
          WHERE pl.task_id = t.id
          ORDER BY pl.created_at DESC
          LIMIT 1
        ), 0) AS latest_progress,
        (
          SELECT JSON_ARRAYAGG(ta.user_id)
          FROM task_assignees ta
          WHERE ta.task_id = t.id AND ta.deleted_at IS NULL
        ) AS assignees
      FROM tasks t
      WHERE t.deleted_at IS NULL
    `;

    let params = [];

    if (filter.title) {
      sql += " AND t.title LIKE ?";
      params.push(`%${filter.title}%`);
    }
    if (filter.project_id) {
      sql += " AND t.project_id = ?";
      params.push(filter.project_id);
    }
    if (filter.start_date) {
      sql += " AND t.start_date >= ?";
      params.push(filter.start_date);
    }
    if (filter.due_date) {
      sql += " AND t.due_date <= ?";
      params.push(filter.due_date);
    }
    if (filter.created_by) {
      sql += " AND t.created_by = ?";
      params.push(filter.created_by);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.mysql.execute(
      "SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return rows[0] || null;
  }

  async update(id, payload) {
    const allowedFields = [
      "title",
      "description",
      "start_date",
      "due_date",
      "status",
      "priority",
    ];

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

    const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);
    await this.mysql.execute(sql, params);

    const updatedTask = await this.findById(id);

    const projectId = updatedTask?.project_id || payload.project_id;

    if (projectId) {
      const members = await this.memberService.getByProjectId(projectId);

      if (members?.length > 0) {
        for (const member of members) {
          sendToUser(member.user_id, "task_updated", {
            task: updatedTask,
            message: `Task "${updatedTask.title}" vừa được cập nhật trong dự án ${projectId}`,
          });
        }
      }
    }

    return updatedTask;
  }

  async delete(id) {
    const task = await this.findById(id);
    if (!task) return null;
    const deletedAt = new Date();
    await this.mysql.execute("UPDATE tasks SET deleted_at = ? WHERE id = ?", [
      deletedAt,
      id,
    ]);
    return { ...task, deleted_at: deletedAt };
  }

  async restore(id) {
    const [result] = await this.mysql.execute(
      "UPDATE tasks SET deleted_at = NULL WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  async findByAccountId(accountId) {
    const sql = `
      SELECT DISTINCT t.* 
      FROM tasks t
      INNER JOIN task_assignees ta ON t.id = ta.task_id
      WHERE ta.user_id = ? AND t.deleted_at IS NULL
    `;
    const [rows] = await this.mysql.execute(sql, [accountId]);
    return rows;
  }

  async logProgress(taskId, progress, loggedBy) {
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO progress_logs (task_id, progress, updated_by)
        VALUES (?, ?, ?)`,
        [taskId, progress, loggedBy]
      );

      const [rows] = await connection.execute(
        `SELECT id, title, project_id FROM tasks WHERE id = ?`,
        [taskId]
      );
      const task = rows[0];

      await connection.commit();

      const newLog = {
        id: result.insertId,
        task_id: taskId,
        progress,
        logged_by: loggedBy,
      };

      if (task?.project_id) {
        const members = await this.memberService.getByProjectId(task.project_id);

        if (members?.length > 0) {
          for (const member of members) {
            sendToUser(member.user_id, "task_updated", {
              task_id: task.id,
              project_id: task.project_id,
              progress,
              message: `Tiến độ của task "${task.title}" vừa được cập nhật: ${progress}%`,
            });
          }
        }
      }

      return newLog;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteAssign(taskId) {
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `DELETE FROM task_assignees WHERE task_id = ?`,
        [taskId]
      );
      await connection.commit();
      return { affectedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = TaskService;