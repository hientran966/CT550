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
      project_id: payload.project_id,
      parent_task_id: payload.parent_task_id ?? null,
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status ?? "todo",
      priority: payload.priority ?? "medium",
      progress_type: payload.progress_type ?? "manual",
      progress_value: payload.progress_value ?? 0,
      start_date: payload.start_date ?? null,
      due_date: payload.due_date ?? null,
      created_by: payload.created_by ?? null,
    };
  }

  async recalculateParentProgress(conn, parentTaskId) {
    const [parentRows] = await conn.execute(
      `SELECT id, progress_type FROM tasks WHERE id = ? AND deleted_at IS NULL`,
      [parentTaskId]
    );
    const parent = parentRows[0];
    if (!parent || parent.progress_type !== "subtask") return;

    const [subs] = await conn.execute(
      `SELECT id, status, progress_value, progress_type
       FROM tasks WHERE parent_task_id = ? AND deleted_at IS NULL`,
      [parentTaskId]
    );

    if (!subs.length) {
      await conn.execute(
        `UPDATE tasks SET progress_value = 0, updated_at = NOW() WHERE id = ?`,
        [parentTaskId]
      );
      return;
    }

    let totalProgress = 0;
    let count = subs.length;

    for (const s of subs) {
      if (s.progress_type === "manual") {
        totalProgress += s.progress_value || 0;
      } else {
        totalProgress += s.status === "done" ? 100 : 0;
      }
    }

    const avgProgress = totalProgress / count;

    await conn.execute(
      `UPDATE tasks SET progress_value = ?, updated_at = NOW() WHERE id = ?`,
      [avgProgress, parentTaskId]
    );
  }

  /** ===================== CREATE TASK ===================== **/
  async create(payload) {
    const task = await this.extractTaskData(payload);
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO tasks (title, description, start_date, due_date, created_by, project_id, parent_task_id, progress_type, progress_value, total_quantity, completed_quantity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.title,
          task.description,
          task.start_date,
          task.due_date,
          task.created_by,
          task.project_id,
          payload.parent_task_id ?? null,
          payload.progress_type ?? "manual",
          payload.progress_value ?? 0,
          payload.total_quantity ?? null,
          payload.completed_quantity ?? null,
          payload.status ?? "todo",
        ]
      );

      const taskId = result.insertId;
      const newTask = { id: taskId, ...task };

      if (payload.parent_task_id) {
        await this.recalculateParentProgress(
          connection,
          payload.parent_task_id
        );
      }

      if (Array.isArray(payload.members) && payload.members.length > 0) {
        for (const userId of payload.members) {
          await this.assignmentService.create(
            { task_id: taskId, user_id: userId, actor_id: payload.created_by },
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

  /** ===================== FIND TASKS ===================== **/
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

    const params = [];

    if (filter.project_id) {
      sql += " AND t.project_id = ?";
      params.push(filter.project_id);
    }
    if (filter.parent_task_id !== undefined) {
      if (filter.parent_task_id === null)
        sql += " AND t.parent_task_id IS NULL";
      else {
        sql += " AND t.parent_task_id = ?";
        params.push(filter.parent_task_id);
      }
    }
    if (filter.status) {
      sql += " AND t.status = ?";
      params.push(filter.status);
    }
    if (filter.title) {
      sql += " AND t.title LIKE ?";
      params.push(`%${filter.title}%`);
    }

    sql += " ORDER BY t.created_at DESC";

    const [rows] = await this.mysql.execute(sql, params);

    for (const row of rows) {
      if (row.progress_type === "quantity") {
        const [q] = await this.mysql.execute(
          `SELECT total_quantity, completed_quantity, unit 
           FROM task_quantity_progress WHERE task_id = ?`,
          [row.id]
        );
        row.quantity_progress = q[0] || {
          total_quantity: 0,
          completed_quantity: 0,
          unit: null,
        };
      } else if (row.progress_type === "subtask") {
        const [subs] = await this.mysql.execute(
          `SELECT id, title, status, progress_value FROM tasks WHERE parent_task_id = ? AND deleted_at IS NULL`,
          [row.id]
        );
        row.subtasks = subs;
      }
    }

    return rows;
  }

  /** ===================== FIND BY ID ===================== **/
  async findById(id) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    const task = rows[0];
    if (!task) return null;

    if (task.progress_type === "manual") {
      const [logRows] = await this.mysql.execute(
        `SELECT progress FROM progress_logs WHERE task_id = ? ORDER BY created_at DESC LIMIT 1`,
        [id]
      );
      task.latest_progress = logRows[0]?.progress ?? task.progress_value;
    } else if (task.progress_type === "quantity") {
      const [rowsQ] = await this.mysql.execute(
        `SELECT total_quantity, completed_quantity, unit 
         FROM task_quantity_progress WHERE task_id = ?`,
        [id]
      );
      const q = rowsQ[0] || {
        total_quantity: 0,
        completed_quantity: 0,
        unit: null,
      };
      task.latest_progress =
        (q.completed_quantity / (q.total_quantity || 1)) * 100;
      task.quantity_progress = q;
    } else if (task.progress_type === "subtask") {
      const [subs] = await this.mysql.execute(
        `SELECT id, title, status, progress_value FROM tasks WHERE parent_task_id = ? AND deleted_at IS NULL`,
        [id]
      );
      const doneCount = subs.filter((s) => s.status === "done").length;
      const progress = subs.length > 0 ? (doneCount / subs.length) * 100 : 0;
      task.latest_progress = progress;
      task.subtasks = subs;
    }

    return task;
  }

  /** ===================== UPDATE TASK ===================== **/
  async update(id, data) {
    const conn = await this.mysql.getConnection();
    try {
      await conn.beginTransaction();

      const [oldRows] = await conn.execute(
        `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );
      const oldTask = oldRows[0];
      if (!oldTask) throw new Error("Task not found");

      const fields = [];
      const params = [];
      for (const key in data) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
      params.push(id);

      if (fields.length)
        await conn.execute(
          `UPDATE tasks SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
          params
        );

      if (oldTask.parent_task_id) {
        await this.recalculateParentProgress(conn, oldTask.parent_task_id);
      }

      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /** ===================== DELETE / RESTORE ===================== **/
  async delete(id) {
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `SELECT id, title, project_id, parent_task_id FROM tasks WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );
      const task = rows[0];
      if (!task) throw new Error("Task not found");

      const deletedAt = new Date();
      await connection.execute(`UPDATE tasks SET deleted_at = ? WHERE id = ?`, [
        deletedAt,
        id,
      ]);

      if (task.parent_task_id) {
        await this.recalculateParentProgress(connection, task.parent_task_id);
      }

      await connection.commit();

      const members = await this.memberService.getByProjectId(task.project_id);
      if (members?.length > 0) {
        for (const member of members) {
          sendToUser(member.user_id, "task_updated", {
            task: task,
            message: `Task "${task.title}" đã được xóa`,
          });
        }
      }

      return { ...task, deleted_at: deletedAt };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async restore(id) {
    const [result] = await this.mysql.execute(
      "UPDATE tasks SET deleted_at = NULL WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  /** ===================== FIND BY USER ===================== **/
  async findByAccountId(userId) {
    const sql = `
      SELECT DISTINCT t.* 
      FROM tasks t
      INNER JOIN task_assignees ta ON t.id = ta.task_id
      WHERE ta.user_id = ? AND t.deleted_at IS NULL
    `;
    const [rows] = await this.mysql.execute(sql, [userId]);
    return rows;
  }

  /** ===================== LOG PROGRESS ===================== **/
  async logProgress(taskId, progressData, loggedBy, comment = null) {
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      // Lấy thông tin task
      const [rows] = await connection.execute(
        `SELECT id, title, project_id, progress_type, parent_task_id, total_quantity, completed_quantity
         FROM tasks WHERE id = ? AND deleted_at IS NULL`,
        [taskId]
      );
      const task = rows[0];
      if (!task) throw new Error("Task not found");

      let progressPercent = 0;

      // ================= MANUAL =================
      if (task.progress_type === "manual") {
        const value = Number(progressData?.progress_value ?? 0);
        progressPercent = Math.max(0, Math.min(100, value));

        // Ghi log
        await connection.execute(
          `INSERT INTO progress_logs (task_id, progress_type, progress, updated_by, comment)
           VALUES (?, 'manual', ?, ?, ?)`,
          [taskId, progressPercent, loggedBy, comment]
        );

        // Cập nhật tasks
        await connection.execute(
          `UPDATE tasks SET progress_value = ?, updated_at = NOW() WHERE id = ?`,
          [progressPercent, taskId]
        );
      }

      // ================= QUANTITY =================
      else if (task.progress_type === "quantity") {
        const { total_quantity, completed_quantity, unit } = progressData;

        // Cập nhật hoặc insert task_quantity_progress
        await connection.execute(
          `INSERT INTO task_quantity_progress (task_id, total_quantity, completed_quantity, unit)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE total_quantity = VALUES(total_quantity), completed_quantity = VALUES(completed_quantity), unit = VALUES(unit)`,
          [taskId, total_quantity, completed_quantity, unit ?? null]
        );

        progressPercent =
          total_quantity > 0
            ? Math.min((completed_quantity / total_quantity) * 100, 100)
            : 0;

        // Cập nhật task
        await connection.execute(
          `UPDATE tasks SET progress_value = ?, total_quantity = ?, completed_quantity = ?, updated_at = NOW() WHERE id = ?`,
          [progressPercent, total_quantity, completed_quantity, taskId]
        );

        // Ghi log
        await connection.execute(
          `INSERT INTO progress_logs (task_id, progress_type, progress, updated_by, comment)
           VALUES (?, 'quantity', ?, ?, ?)`,
          [taskId, progressPercent, loggedBy, comment]
        );
      }

      // ================= SUBTASK =================
      else if (task.progress_type === "subtask") {
        // Lấy danh sách subtask
        const [subs] = await connection.execute(
          `SELECT id, status FROM tasks WHERE parent_task_id = ? AND deleted_at IS NULL`,
          [taskId]
        );

        const doneCount = subs.filter((s) => s.status === "done").length;
        const progress = subs.length > 0 ? (doneCount / subs.length) * 100 : 0;
        progressPercent = progress;

        await connection.execute(
          `UPDATE tasks SET progress_value = ?, updated_at = NOW() WHERE id = ?`,
          [progressPercent, taskId]
        );

        // Ghi log
        await connection.execute(
          `INSERT INTO progress_logs (task_id, progress_type, progress, updated_by, comment)
           VALUES (?, 'subtask', ?, ?, ?)`,
          [taskId, progressPercent, loggedBy, comment]
        );
      }

      // ================== UPDATE TASK CHA (nếu có) ==================
      if (task.parent_task_id) {
        await this.recalculateParentProgress(connection, task.parent_task_id);
      }

      await connection.commit();

      // ================== GỬI THÔNG BÁO SOCKET ==================
      const members = await this.memberService.getByProjectId(task.project_id);
      for (const member of members) {
        sendToUser(member.user_id, "task_progress_logged", {
          task_id: task.id,
          project_id: task.project_id,
          progress_type: task.progress_type,
          progress_value: progressPercent,
          message: `Tiến độ của task "${task.title}" vừa được cập nhật: ${progressPercent.toFixed(
            1
          )}%`,
        });
      }

      return {
        task_id: taskId,
        progress_type: task.progress_type,
        progress_value: progressPercent,
        logged_by: loggedBy,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /** ===================== DELETE ASSIGN ===================== **/
  async deleteAssign(taskId) {
    const [result] = await this.mysql.execute(
      `DELETE FROM task_assignees WHERE task_id = ?`,
      [taskId]
    );
    return { affectedRows: result.affectedRows };
  }

  /** ===================== GET ROLE ===================== **/
  async getRole(taskId, userId) {
    const sql = `
      SELECT
        CASE WHEN t.created_by = ? THEN TRUE ELSE FALSE END AS isCreator,
        CASE WHEN ta.id IS NOT NULL THEN TRUE ELSE FALSE END AS isAssigned
      FROM tasks t
      LEFT JOIN task_assignees ta 
        ON t.id = ta.task_id 
        AND ta.user_id = ? 
        AND ta.deleted_at IS NULL
      WHERE t.id = ? 
        AND t.deleted_at IS NULL
      LIMIT 1;
    `;
    const [rows] = await this.mysql.execute(sql, [userId, userId, taskId]);
    return rows[0] || { isCreator: false, isAssigned: false };
  }
}

module.exports = TaskService;
