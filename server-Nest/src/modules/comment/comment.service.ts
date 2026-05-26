import { Inject, Injectable } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';
import { SocketService } from '../../socket/socket.service';

@Injectable()
export class CommentService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly notificationService: NotificationService,
    private readonly activityService: ActivityService,
    private readonly socketService: SocketService,
  ) {}

  extractCommentData(payload: any) {
    return {
      user_id: payload.user_id ?? null,
      task_id: payload.task_id ?? null,
      file_id: payload.file_id ?? null,
      file_version_id: payload.file_version_id ?? null,
      content: payload.content ?? null,
    };
  }

  async create(payload: any) {
    const comment = this.extractCommentData(payload);
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      const [commentRes] = await connection.execute(
        `INSERT INTO comments (user_id, task_id, file_version_id, content)
         VALUES (?, ?, ?, ?)`,
        [
          comment.user_id,
          comment.task_id,
          comment.file_version_id,
          comment.content,
        ],
      );
      const commentId = commentRes.insertId;

      if (payload.visual) {
        await connection.execute(
          `INSERT INTO visual_annotations
            (comment_id, file_version_id, coordinates, color, opacity)
           VALUES (?, ?, ?, ?, ?)`,
          [
            commentId,
            comment.file_version_id,
            JSON.stringify(payload.visual.coordinates ?? {}),
            payload.visual.color ?? '#FF0000',
            payload.visual.opacity ?? 0.5,
          ],
        );
      }

      if (payload.owner_id && payload.owner_id !== comment.user_id) {
        await this.notificationService.create(
          {
            recipient_id: payload.owner_id,
            actor_id: comment.user_id,
            type: 'comment_added',
            reference_type: comment.task_id
              ? 'task'
              : comment.file_id
                ? 'file'
                : 'project',
            reference_id: comment.task_id || comment.file_id || null,
          },
          connection,
        );
      }

      if (comment.task_id) {
        await this.activityService.create(
          {
            task_id: comment.task_id,
            actor_id: comment.user_id,
            detail: 'Binh luan moi',
          },
          connection,
        );
      }

      await connection.commit();
      const fullComment = await this.findById(commentId);

      if (payload.project_id) {
        await this.socketService.sendToProject(this.mysql, payload.project_id, 'comment', {
          action: 'create',
          data: fullComment,
        });
      }

      return fullComment;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async find(filter: any = {}) {
    const conditions = ['c.deleted_at IS NULL'];
    const params: any[] = [];

    if (filter.user_id) {
      conditions.push('c.user_id = ?');
      params.push(filter.user_id);
    }
    if (filter.task_id) {
      conditions.push('c.task_id = ?');
      params.push(filter.task_id);
    }
    if (filter.file_version_id) {
      conditions.push('c.file_version_id = ?');
      params.push(filter.file_version_id);
    }

    const sql = `
      SELECT
        c.*,
        JSON_OBJECT('id', u.id, 'name', u.name) AS user,
        JSON_OBJECT(
          'id', va.id,
          'coordinates', va.coordinates,
          'color', va.color,
          'opacity', va.opacity
        ) AS visual
      FROM comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN visual_annotations va ON va.comment_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.created_at DESC
    `;

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT
        c.*,
        JSON_OBJECT('id', u.id, 'name', u.name) AS user,
        JSON_OBJECT(
          'id', va.id,
          'coordinates', va.coordinates,
          'color', va.color,
          'opacity', va.opacity
        ) AS visual
      FROM comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN visual_annotations va ON va.comment_id = c.id
      WHERE c.id = ? AND c.deleted_at IS NULL
      `,
      [id],
    );
    return rows[0] || null;
  }

  async update(id: number, payload: any) {
    const fields: string[] = [];
    const params: any[] = [];

    if (Object.hasOwn(payload, 'content')) {
      fields.push('content = ?');
      params.push(payload.content);
    }

    if (!fields.length && !payload.visual) return this.findById(id);

    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      if (fields.length) {
        params.push(id);
        await connection.execute(
          `UPDATE comments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          params,
        );
      }

      if (payload.visual) {
        const [exists] = await connection.execute(
          'SELECT id FROM visual_annotations WHERE comment_id = ?',
          [id],
        );

        if (exists.length) {
          await connection.execute(
            `UPDATE visual_annotations
             SET coordinates = ?, color = ?, opacity = ?
             WHERE comment_id = ?`,
            [
              JSON.stringify(payload.visual.coordinates ?? {}),
              payload.visual.color ?? '#FF0000',
              payload.visual.opacity ?? 0.5,
              id,
            ],
          );
        } else {
          await connection.execute(
            `INSERT INTO visual_annotations (comment_id, file_version_id, coordinates, color, opacity)
             VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              payload.file_version_id ?? null,
              JSON.stringify(payload.visual.coordinates ?? {}),
              payload.visual.color ?? '#FF0000',
              payload.visual.opacity ?? 0.5,
            ],
          );
        }
      }

      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async delete(id: number) {
    const comment = await this.findById(id);
    if (!comment) return null;

    const deletedAt = new Date();
    await this.mysql.execute('UPDATE comments SET deleted_at = ? WHERE id = ?', [
      deletedAt,
      id,
    ]);
    return { ...comment, deleted_at: deletedAt };
  }
}
