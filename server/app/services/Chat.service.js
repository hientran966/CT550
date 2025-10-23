const NotificationService = require("./Notification.service");
const { sendMessageToChannel } = require("../socket/index");

class ChatService {
  constructor(mysql) {
    this.mysql = mysql;
    this.notificationService = new NotificationService(mysql);
  }

  async extractChatData(payload) {
    return {
      project_id: payload.project_id ?? null,
      name: payload.name ?? null,
      description: payload.description ?? null,
      type: payload.type ?? "general",
      created_by: payload.created_by,
    };
  }

  //channel
  async create(payload, connection = null) {
    const chat = await this.extractChatData(payload);
    const shouldRelease = !connection;
    const conn = connection || (await this.mysql.getConnection());

    try {
      if (!connection) await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO chat_channels (project_id, name, description, type, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
          chat.project_id,
          chat.name,
          chat.description,
          chat.type,
          chat.created_by,
        ]
      );

      const newChat = { id: result.insertId, ...chat };

      if (!connection) await conn.commit();
      return newChat;
    } catch (error) {
      if (!connection) await conn.rollback();
      throw error;
    } finally {
      if (shouldRelease) conn.release();
    }
  }

  async find(filter = {}) {
    let sql = "SELECT * FROM chat_channels WHERE deleted_at IS NULL";
    const params = [];

    if (filter.name) {
      sql += " AND name LIKE ?";
      params.push(`%${filter.name}%`);
    }
    if (filter.project_id) {
      sql += " AND project_id = ?";
      params.push(filter.project_id);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.mysql.execute(
      "SELECT * FROM chat_channels WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return rows[0] || null;
  }

  async update(id, payload) {
    const chat = await this.extractChatData(payload);
    const fields = [];
    const params = [];

    for (const key in chat) {
      if (chat[key] !== undefined && key !== "id") {
        fields.push(`${key} = ?`);
        params.push(chat[key]);
      }
    }

    if (!fields.length) return await this.findById(id);

    const sql = `UPDATE chat_channels SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);
    await this.mysql.execute(sql, params);
    return this.findById(id);
  }

  async delete(id) {
    const deletedAt = new Date();
    await this.mysql.execute(
      "UPDATE chat_channels SET deleted_at = ? WHERE id = ?",
      [deletedAt, id]
    );
    return true;
  }

  async restore(id) {
    const [result] = await this.mysql.execute(
      "UPDATE chat_channels SET deleted_at = NULL WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  //member
  async addMember(channel_id, user_id) {
    await this.mysql.execute(
      `INSERT INTO chat_channel_members (channel_id, user_id)
       VALUES (?, ?)`,
      [channel_id, user_id]
    );
    return { channel_id, user_id };
  }

  async removeMember(channel_id, user_id) {
    await this.mysql.execute(
      `UPDATE chat_channel_members SET deleted_at = NOW()
       WHERE channel_id = ? AND user_id = ?`,
      [channel_id, user_id]
    );
    return { channel_id, user_id, deleted: true };
  }

  async getMembers(channel_id) {
    const [rows] = await this.mysql.execute(
      `SELECT u.id, u.name, u.email
       FROM chat_channel_members ccm
       JOIN users u ON u.id = ccm.user_id
       WHERE ccm.channel_id = ? AND ccm.deleted_at IS NULL`,
      [channel_id]
    );
    return rows;
  }

  //message
  async addMessage(payload) {
    const { channel_id, sender_id, parent_id, content } = payload;

    const [result] = await this.mysql.execute(
      `INSERT INTO chat_messages (channel_id, sender_id, parent_id, content)
       VALUES (?, ?, ?, ?)`,
      [channel_id, sender_id, parent_id ?? null, content]
    );

    const messageId = result.insertId;

    const [messageRows] = await this.mysql.execute(
      `SELECT m.*, u.name AS sender_name, u.id as user_id
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [messageId]
    );

    const message = messageRows[0];

    sendMessageToChannel(channel_id, message);

    const [members] = await this.mysql.execute(
      `SELECT user_id FROM chat_channel_members 
       WHERE channel_id = ? AND deleted_at IS NULL`,
      [channel_id]
    );

    for (const m of members) {
      if (m.user_id === sender_id) continue;
      await this.notificationService.create({
        recipient_id: m.user_id,
        actor_id: sender_id,
        type: "chat_message",
        reference_type: "chat_message",
        reference_id: messageId,
        message: `Tin nhắn mới trong kênh`,
      });
    }

    return message;
  }

  async getMessages(channel_id, { limit = 50, offset = 0 } = {}) {
    limit = Number(limit) || 50;
    offset = Number(offset) || 0;

    const sql = `
            SELECT m.*, u.name AS sender_name
            FROM chat_messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.channel_id = ? AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

    const [rows] = await this.mysql.execute(sql, [channel_id]);
    return rows;
  }

  async getThreadMessages(parent_id) {
    const [rows] = await this.mysql.execute(
      `SELECT m.*, u.name AS sender_name
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.parent_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at ASC`,
      [parent_id]
    );
    return rows;
  }

  //mentions
  async addMentions(message_id, mentioned_user_ids = [], actor_id) {
    if (!mentioned_user_ids.length) return;
    const values = mentioned_user_ids.map((uid) => [message_id, uid]);
    await this.mysql.query(
      `INSERT INTO chat_mentions (message_id, mentioned_user_id)
       VALUES ?`,
      [values]
    );

    for (const uid of mentioned_user_ids) {
      await this.notificationService.create({
        recipient_id: uid,
        actor_id: actor_id,
        type: "mention",
        reference_type: "chat_message",
        reference_id: message_id,
        message: "Bạn được nhắc đến trong cuộc trò chuyện",
      });
    }
  }
}

module.exports = ChatService;
