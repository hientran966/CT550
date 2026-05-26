import { Inject, Injectable } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { NotificationService } from '../notification/notification.service';
import { SocketService } from '../../socket/socket.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly notificationService: NotificationService,
    private readonly fileService: FileService,
    private readonly socketService: SocketService,
  ) {}

  extractChatData(payload: any) {
    return {
      project_id: payload.project_id ?? null,
      name: payload.name ?? null,
      description: payload.description ?? null,
      created_by: payload.created_by,
    };
  }

  extractMentionIds(content: string) {
    if (!content) return [];
    if (content.includes('@All')) return ['all'];

    const regex = /<@user:(\d+)>/g;
    const ids = new Set<number>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) ids.add(Number(match[1]));
    return Array.from(ids);
  }

  async create(payload: any, connection: any = null) {
    const chat = this.extractChatData(payload);
    const members = Array.isArray(payload.members) ? payload.members : [];
    const conn = connection || (await this.mysql.getConnection());

    try {
      if (!connection) await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO chat_channels (project_id, name, description, created_by)
         VALUES (?, ?, ?, ?)`,
        [chat.project_id, chat.name, chat.description, chat.created_by],
      );
      const channelId = result.insertId;

      await conn.query(
        `INSERT IGNORE INTO chat_channel_members (channel_id, user_id)
         VALUES (?, ?)`,
        [channelId, chat.created_by],
      );

      if (members.length) {
        await conn.query(
          `INSERT IGNORE INTO chat_channel_members (channel_id, user_id)
           VALUES ?`,
          [members.map((uid) => [channelId, uid])],
        );
      }

      if (!connection) await conn.commit();
      return { id: channelId, ...chat, members };
    } catch (error) {
      if (!connection) await conn.rollback();
      throw error;
    } finally {
      if (!connection) conn.release();
    }
  }

  async find(filter: any = {}) {
    let sql = 'SELECT * FROM chat_channels WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (filter.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }
    if (filter.project_id) {
      sql += ' AND project_id = ?';
      params.push(filter.project_id);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      'SELECT * FROM chat_channels WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return rows[0] || null;
  }

  async getByUserId(userId: number, projectId: number) {
    const [rows] = await this.mysql.execute(
      `SELECT c.*
       FROM chat_channels c
       JOIN chat_channel_members cm ON cm.channel_id = c.id
       WHERE cm.user_id = ? AND c.project_id = ?
         AND c.deleted_at IS NULL AND cm.deleted_at IS NULL`,
      [userId, projectId],
    );
    return rows;
  }

  async update(id: number, payload: any) {
    const chat = this.extractChatData(payload);
    const fields: string[] = [];
    const params: any[] = [];

    for (const key in chat) {
      if (chat[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(chat[key]);
      }
    }

    if (!fields.length) return this.findById(id);

    await this.mysql.execute(
      `UPDATE chat_channels SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id],
    );
    return this.findById(id);
  }

  async delete(id: number) {
    await this.mysql.execute(
      'UPDATE chat_channels SET deleted_at = ? WHERE id = ?',
      [new Date(), id],
    );
    return true;
  }

  async restore(id: number) {
    const [result] = await this.mysql.execute(
      'UPDATE chat_channels SET deleted_at = NULL WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async addMember(channelId: number, userId: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM chat_channel_members WHERE channel_id = ? AND user_id = ?`,
      [channelId, userId],
    );

    if (rows.length) {
      if (rows[0].deleted_at) {
        await this.mysql.execute(
          `UPDATE chat_channel_members SET deleted_at = NULL WHERE channel_id = ? AND user_id = ?`,
          [channelId, userId],
        );
      }
    } else {
      await this.mysql.execute(
        `INSERT INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)`,
        [channelId, userId],
      );
    }

    return { channel_id: channelId, user_id: userId };
  }

  async removeMember(channelId: number, userId: number) {
    await this.mysql.execute(
      `UPDATE chat_channel_members SET deleted_at = NOW()
       WHERE channel_id = ? AND user_id = ?`,
      [channelId, userId],
    );
    return { channel_id: channelId, user_id: userId, deleted: true };
  }

  async getMembers(channelId: number) {
    const [rows] = await this.mysql.execute(
      `SELECT u.id AS user_id, u.name, u.email
       FROM chat_channel_members ccm
       JOIN users u ON u.id = ccm.user_id
       WHERE ccm.channel_id = ? AND ccm.deleted_at IS NULL`,
      [channelId],
    );
    return rows;
  }

  async addMessage(payload: any) {
    const { channel_id, sender_id, content } = payload;

    const [result] = await this.mysql.execute(
      `INSERT INTO chat_messages (channel_id, sender_id, content)
       VALUES (?, ?, ?)`,
      [channel_id, sender_id, content],
    );
    const messageId = result.insertId;

    const mentionedUserIds = this.extractMentionIds(content);
    if (mentionedUserIds.length) {
      await this.addMentions(messageId, mentionedUserIds, sender_id);
    }

    const [rows] = await this.mysql.execute(
      `SELECT m.*, u.name AS sender_name, u.id AS user_id
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [messageId],
    );
    const message = rows[0];

    const avatar = await this.fileService.getAvatar(message.sender_id);
    message.sender_avatar = avatar?.file_url || null;
    this.socketService.sendMessageToChannel(channel_id, message);

    return message;
  }

  async getMessages(channelId: number, { limit = 50, offset = 0 }: any = {}) {
    limit = Number(limit) || 50;
    offset = Number(offset) || 0;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const [rows] = await this.mysql.execute(
      `SELECT m.*, u.name AS sender_name, u.id AS sender_id
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.channel_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at ASC
       LIMIT ${limit} OFFSET ${offset}`,
      [channelId],
    );

    for (const msg of rows) {
      const [mentionRows] = await this.mysql.execute(
        `SELECT cm.mentioned_user_id, u.name AS mentioned_user_name
         FROM chat_mentions cm
         JOIN users u ON u.id = cm.mentioned_user_id
         WHERE cm.message_id = ?`,
        [msg.id],
      );
      msg.mentions = mentionRows.map((mr) => ({
        id: mr.mentioned_user_id,
        name: mr.mentioned_user_name,
      }));

      if (msg.have_file) {
        const [files] = await this.mysql.execute(
          `SELECT f.*,
            (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', fv.id,
                  'file_id', fv.file_id,
                  'version_number', fv.version_number,
                  'file_url', fv.file_url,
                  'file_type', fv.file_type
                )
              )
              FROM file_versions fv
              WHERE fv.file_id = f.id
            ) AS versions
           FROM chat_message_files cmf
           JOIN files f ON cmf.file_id = f.id
           WHERE cmf.message_id = ? AND f.deleted_at IS NULL`,
          [msg.id],
        );

        for (const file of files) {
          if (file.file_url && !file.file_url.startsWith('http')) {
            file.file_url = `${baseUrl}/${file.file_url.replace(/\\/g, '/')}`;
          }
          if (typeof file.versions === 'string') {
            try {
              file.versions = JSON.parse(file.versions);
            } catch {
              file.versions = [];
            }
          }
          file.versions = Array.isArray(file.versions)
            ? file.versions.map((v) => ({
                ...v,
                file_url: v.file_url
                  ? `${baseUrl}/${v.file_url.replace(/\\/g, '/')}`
                  : null,
              }))
            : [];
        }
        msg.files = files;
      } else {
        msg.files = [];
      }

      const avatar = await this.fileService.getAvatar(msg.sender_id);
      msg.sender_avatar = avatar?.file_url || null;
    }

    return rows;
  }

  async getMessageChannel(messageId: number) {
    const [rows] = await this.mysql.execute(
      `SELECT c.*
       FROM chat_channels c
       JOIN chat_messages m ON m.channel_id = c.id
       WHERE m.id = ? AND c.deleted_at IS NULL`,
      [messageId],
    );
    return rows[0] || null;
  }

  async addMentions(
    messageId: number,
    mentionedUserIds: any[] = [],
    actorId: number,
    connection: any = this.mysql,
  ) {
    if (!mentionedUserIds.length) return;

    if (mentionedUserIds.includes('all')) {
      const [users] = await connection.execute(
        `SELECT user_id
         FROM chat_channel_members
         WHERE channel_id = (SELECT channel_id FROM chat_messages WHERE id = ?)
           AND deleted_at IS NULL`,
        [messageId],
      );

      for (const user of users) {
        if (String(user.user_id) === String(actorId)) continue;
        await this.notificationService.create({
          recipient_id: user.user_id,
          actor_id: actorId,
          type: 'mention',
          reference_type: 'chat_message',
          reference_id: messageId,
          message: 'Ban duoc nhac den trong cuoc tro chuyen (@All)',
        });
      }
      return;
    }

    const values = mentionedUserIds
      .filter((uid) => uid !== actorId)
      .map((uid) => [messageId, uid]);

    if (!values.length) return;

    await connection.query(
      `INSERT INTO chat_mentions (message_id, mentioned_user_id) VALUES ?`,
      [values],
    );

    for (const uid of mentionedUserIds) {
      if (uid === actorId) continue;
      await this.notificationService.create({
        recipient_id: uid,
        actor_id: actorId,
        type: 'mention',
        reference_type: 'chat_message',
        reference_id: messageId,
        message: 'Ban duoc nhac den trong cuoc tro chuyen',
      });
    }
  }

  async addMessageWithFiles(payload: any) {
    const { channel_id, sender_id, content = null, files = [] } = payload;
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      const [msgResult] = await connection.execute(
        `INSERT INTO chat_messages (channel_id, sender_id, content, have_file)
         VALUES (?, ?, ?, true)`,
        [channel_id ?? null, sender_id ?? null, content ?? null],
      );
      const messageId = msgResult.insertId;

      const mentionedUserIds = this.extractMentionIds(content);
      if (mentionedUserIds.length) {
        await this.addMentions(messageId, mentionedUserIds, sender_id, connection);
      }

      let attachedFiles: any[] = [];
      if (Array.isArray(files) && files.length) {
        attachedFiles = (
          await Promise.all(
            files.map(async (file) => {
              const saved: any = await this.fileService.create({
                ...file,
                created_by: sender_id,
                project_id: payload.project_id ?? file?.project_id ?? null,
                task_id: file?.task_id ?? null,
              });

              const fileId = saved?.id || saved?.file_id;
              if (!fileId) return null;

              await connection.execute(
                `INSERT INTO chat_message_files (message_id, file_id) VALUES (?, ?)`,
                [messageId, fileId],
              );
              return saved;
            }),
          )
        ).filter(Boolean);
      }

      const [msgRows] = await connection.execute(
        `SELECT m.*, u.name AS sender_name, u.id AS user_id
         FROM chat_messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.id = ?`,
        [messageId],
      );

      const message = msgRows[0] ?? {};
      message.files = attachedFiles;
      message.have_file = attachedFiles.length > 0;

      const avatar = await this.fileService.getAvatar(message.sender_id);
      message.sender_avatar = avatar?.file_url || null;

      await connection.commit();
      this.socketService.sendMessageToChannel(channel_id, message);

      return message;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
